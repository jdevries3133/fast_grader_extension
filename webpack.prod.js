const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("./webpack.common");
const replace = require("buffer-replace");

module.exports = merge(common, {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
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
        {
          from: "./src/*.html",
          to: "[name].html",
          transform(buf) {
            return replace(
              buf,
              "http://localhost:8000",
              "https://classfast.app"
            );
          },
        },
      ],
    }),
  ],
});
