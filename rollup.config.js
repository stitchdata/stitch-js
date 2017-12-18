import babel from "rollup-plugin-babel";
import babelrc from "babelrc-rollup";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import pkg from "./package.json";
import uglify from "rollup-plugin-uglify";

const BASE_CONFIG = {
  input: "src/index.js",
  plugins: [
    replace({
      "process.env.STITCH_JS_HOST": `"${process.env.STITCH_JS_HOST ||
        "https://app.stitchdata.com"}"`,
      "process.env.STITCH_JS_VERBOSE_OUTPUT":
        process.env.STITCH_JS_VERBOSE_OUTPUT
    })
  ]
};

const BASE_UMD_CONFIG = Object.assign({}, BASE_CONFIG, {
  plugins: [...BASE_CONFIG.plugins, resolve(), commonjs(), babel(babelrc())]
});

export default [
  // browser-friendly UMD build
  Object.assign({}, BASE_UMD_CONFIG, {
    output: [
      {
        file: pkg.browser,
        format: "umd",
        name: "Stitch"
      }
    ]
  }),

  // minified browser-friendly UMD build
  Object.assign({}, BASE_UMD_CONFIG, {
    output: [{ file: pkg.browserMin, format: "umd", name: "Stitch" }],
    plugins: [...BASE_UMD_CONFIG.plugins, uglify()]
  }),

  // // ES module (for bundlers) build.
  Object.assign({}, BASE_CONFIG, {
    external: ["core-js/library/fn/object", "core-js/library/fn/promise"],
    output: [{ file: pkg.main, format: "es" }]
  })
];
