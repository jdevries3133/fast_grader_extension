const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: path.join(__dirname, "src", "popup.ts"),
    background: path.join(__dirname, "src", "background.ts"),
    content: path.join(__dirname, "src", "content.ts"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "babel-loader",
      },
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/webextension-polyfill/dist/browser-polyfill.js",
        },

        {
          from: "./src/*.html",
          to: "[name].html",
        },
        {
          from: "./src/manifest.json",
          to: "manifest.json",
        },
        {
          from: "./src/icons/*",
          to: "icons/[name][ext]",
        },
      ],
    }),
  ],
};
