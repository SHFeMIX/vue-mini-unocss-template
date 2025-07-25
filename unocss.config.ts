import { presetWeapp } from 'unocss-preset-weapp';
import { defineConfig } from 'unocss'
import { extractorAttributify, transformerClass } from 'unocss-preset-weapp/transformer'

const { presetWeappAttributify, transformerAttributify } = extractorAttributify()

export default defineConfig({
  content: {
    filesystem: [
      'dist/**/*.{wxml,js,json,wxss}',
      '!dist/**/miniprogram_npm/**/*',
    ],
  },
  presets: [
    presetWeapp({
      whRpx: true,
    }),
    presetWeappAttributify(),
  ],
  separators: '__',
  transformers: [
    transformerAttributify(),
    transformerClass(),
  ],
})
