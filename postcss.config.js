import pxtorpx from 'postcss-pxtorpx-pro';
import UnoCSS from '@unocss/postcss'

const config = {
  plugins: [
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
