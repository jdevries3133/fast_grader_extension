const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.(j|t)s(x)?$/,
        loader: "string-replace-loader",
        options: {
          search: /http:\/\/localhost:8000/,
          replace: "https://classfast.app",
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "./src/manifest.json",
          to: "manifest.json",
        },
      ],
    }),
  ],
});
