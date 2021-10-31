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
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        loader: "babel-loader",
      },
      {
        test: /\.(j|t)s(x)?$/,
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
