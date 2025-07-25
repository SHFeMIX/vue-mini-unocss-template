# 集成了 UnoCSS 的 Vue Mini 项目模版

## 什么是 Vue Mini
Vue Mini 是一个基于 Vue 3 的小程序框架，它能让你用组合式 API 写小程序。

Vue Mini 底层直接依赖于 @vue/reactivity，它是 Vue 3 的响应式核心。你可以简单的将 Vue Mini 理解为 @vue/reactivity 与小程序的绑定。

Vue Mini 同时也提供了官方项目脚手架工具 [create-vue-mini](https://github.com/vue-mini/create-vue-mini) 用来创建 Vue Mini 小程序。

更多信息请访问官方文档：[vuemini.org](https://vuemini.org)

## 什么是 UnoCSS
UnoCSS 是一个快速的、按需生成的原子化 CSS 引擎。作者是 Vue、Vite、Nuxt 核心团队成员，VueUse、Slidev 等知名开源库的作者 Anthony Fu。

对比 Tailwind CSS，UnoCSS 的优势在于高度可定制、性能更好以及更轻量，适合对项目体积要求严苛的微信小程序场景。


更多信息请访问官方文档：[UnoCSS](https://unocss.dev)

## 关于本模版
本模版在 [create-vue-mini](https://github.com/vue-mini/create-vue-mini) 创建的初始项目基础上，提供了开箱即用的 UnoCSS 支持。

除了支持 TypeScript、Pinia 用于状态管理、Vitest 用于单元测试，ESLint、Stylelint 和 Prettier 外，已经支持的 UnoCSS 功能有：
* 兼容  WXML 和 WXSS 特殊语法
* UnoCSS [属性化模式](https://unocss.dev/presets/attributify#attributify-mode)
* 热更新
* IDE 提示和自动补全

### 依赖安装

```sh
pnpm install
```

### 本地开发

```sh
pnpm dev
```

### 生产构建

```sh
pnpm build
```

### 代码格式化

```sh
pnpm format
```

### TS 代码质量检测

```sh
pnpm lint:script
```

### CSS 代码质量检测

```sh
pnpm lint:style
```

### 类型检测

```sh
pnpm type-check
```

### 单元测试

```sh
pnpm test
```

## 集成方案
create-vue-mini 生成的项目使用自定义脚本文件 build.js 执行打包构建以及热更新，深入了解可以参考这篇文章：[开发小程序又一新选择 vue-mini，据说性能是 Taro 的 10 倍，遥遥领先](https://juejin.cn/post/7392444932965416996?share_token=B82C1E26-F8CA-44B8-8074-F69BBA277D5C)。

由于没有使用构建工具，自然无法享受对应的插件生态，实现对第三方插件的支持会稍显繁琐，需要修改 build.js 源码。

### 配置 postcss.config.js
```js
import pxtorpx from 'postcss-pxtorpx-pro';
import UnoCSS from '@unocss/postcss'

const config = {
  plugins: [
    // 引入 UnoCSS 的 PostCSS 插件即可
    UnoCSS(),
    {
      postcssPlugin: 'postcss-import-css-to-wxss',
      AtRule: {
        import: (atRule) => {
          atRule.params = atRule.params.replace('.css', '.wxss');
        },
      },
    },
    pxtorpx({ transform: (x) => x }),
  ],
};

export default config;
```
build.js 支持 PostCSS，因此可以直接使用 UnoCSS 的 PostCSS 插件，更多细节请参考官方文档：https://unocss.dev/integrations/postcss。

同时需要在 src/app.css 文件起始处添加一行 ```@unocss;```，之后 unocss 生成的样式都会注入 dist/app.wxss 文件。

### 配置 unocss.config.ts
```ts
import { presetWeapp } from 'unocss-preset-weapp';
import { defineConfig } from 'unocss'
import { extractorAttributify, transformerClass } from 'unocss-preset-weapp/transformer'

const { presetWeappAttributify, transformerAttributify } = extractorAttributify()

export default defineConfig({
  content: {
    filesystem: [
      // 扫描 dist 目录下经过编译转换后的文件生成样式，而不是扫描开发者编写的源文件
      'dist/**/*.{wxml,js,json,wxss}',
      '!dist/**/miniprogram_npm/**/*',
    ],
  },
  presets: [
    // 使用 UnoCSS 小程序预设，内部已经解决小程序不兼容的相关问题
    presetWeapp({
      whRpx: true,
    }),
    // 提供 UnoCSS 模式属性化的自动补全支持
    presetWeappAttributify(),
  ],
  // 小程序不支持带 : 的类名，指定其他分隔符号
  // 比如 hover:bg-red-500 可以使用 hover__bg-red-500 表示
  separators: '__',
  transformers: [
    // 小程序不支持属性选择器，需使用 transformer 将标签的属性合并入 class
    // 后续依旧生成类选择器的样式，以此支持属性化写法
    transformerAttributify(),
    // 将小程序不支持的 \\ \\: \\[ \\$ \\. 等转义类名，根据规则替换
    transformerClass(),
  ],
})
```
更多关于 unocss-preset-weapp 的信息参考：[unocss-preset-weapp](https://github.com/MellowCo/unocss-preset-weapp), [unocss-wechat](https://github.com/MellowCo/unocss-preset-weapp)。

### 修改 build.js，在打包构建和热更新时重新生成样式代码
修改 dev 函数：
```js
async function dev() {
  await fs.remove('dist');
  await findIndependentPackages();
  await scanDependencies();
  chokidar
    .watch(['src'], {
      ignored: (file, stats) =>
        stats?.isFile() &&
        (file.endsWith('.gitkeep') || file.endsWith('.DS_Store')),
    })
    .on('add', (filePath) => {
      console.log(bold(green(`添加文件：${filePath}`)));
      const promise = cb(filePath);
      topLevelJobs?.push(promise);
    })
    .on('change', (filePath) => {
      console.log(bold(green(`修改文件：${filePath}`)));
      cb(filePath)
        .then(() => {
          if (
            filePath.endsWith('.ts') ||
            filePath.endsWith('.js') ||
            filePath.endsWith('.html') ||
            filePath.endsWith('.json') ||
            filePath.endsWith('.css')
          ) {
            processStyle('src/app.css');
          }
        })
        .then(() => {
          console.log(bold(green('unocss 样式代码生成完毕')));
        });
    })
    .on('ready', async () => {
      await Promise.all(topLevelJobs);
      await Promise.all(bundleJobs);
      await processStyle('src/app.css');
      console.log(bold(green('unocss 样式代码生成完毕')));
      console.log(bold(green(`启动完成，耗时：${Date.now() - startTime}ms`)));
      console.log(bold(green('监听文件变化中...')));
      // Release memory.
      topLevelJobs = null;
      bundleJobs = null;
    });
}
```
在每次热更新和构建完成后，额外处理一次 src/app.css 文件。此时 UnoCSS 的 PostCSS 插件会执行，扫描 dist 目录下文件，重新生成样式代码注入 dist/app.wxss 文件。

同样的方式修改 prod 函数，只需要在构建完成后再额外处理一次 src/app.css 文件。
```js
async function prod() {
  await fs.remove('dist');
  await findIndependentPackages();
  await scanDependencies();
  const watcher = chokidar.watch(['src'], {
    ignored: (file, stats) =>
      stats?.isFile() &&
      (file.endsWith('.gitkeep') || file.endsWith('.DS_Store')),
  });
  watcher.on('add', (filePath) => {
    const promise = cb(filePath);
    topLevelJobs.push(promise);
  });
  watcher.on('ready', async () => {
    const promise = watcher.close();
    topLevelJobs.push(promise);
    await Promise.all(topLevelJobs);
    await Promise.all(bundleJobs);
    await processStyle('src/app.css');
    console.log(bold(green('unocss 样式代码生成完毕')));
    console.log(bold(green(`构建完成，耗时：${Date.now() - startTime}ms`)));
  });
}
```

### 修改 build.js，手动执行 transformers
通过 PostCSS 插件的方式使用 UnoCSS，不支持 transformers，因此需要在处理 html 时手动调用 transformers 对源文件进行转换，将转换后的内容输出到 dist 目录。

在 build.js 中导入 loadConfig 和 MagicString：
```js
import { loadConfig } from '@unocss/config'
import MagicString from 'magic-string';
```

重写 processTemplate 函数：
```js
async function processTemplate(filePath) {
  const { config } = await loadConfig();
  const { transformers } = config

  const content = await fs.readFile(filePath, 'utf8');
  // 在模板内容首尾添加<template>标签,不然 transformerAttributify 不处理
  const wrappedContent = `<template>${content}</template>`;

  // transformer 第一个参数是源文件内容的 MagicString 实例
  const result = new MagicString(wrappedContent);
  transformers.forEach(transformer => {
    transformer.transform(result, filePath)
  })

  let finalContent = result.toString();
  // 移除 transformerClass 在文件第一行添加的注释
  finalContent = finalContent.replace(/^\/\*.*?\*\/\s*/, '');
  // 移除首尾添加的<template>标签
  finalContent = finalContent.replace(/^<template>/, '').replace(/<\/template>$/, '');

  const destination = filePath
    .replace('src', 'dist')
    .replace(/\.html$/, '.wxml');
  // Make sure the directory already exists when write file
  await fs.copy(filePath, destination);
  await fs.writeFile(destination, finalContent);
}
```
