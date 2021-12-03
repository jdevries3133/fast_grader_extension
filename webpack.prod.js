const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("./webpack.common");
const replace = require("buffer-replace");

// two main differences versus development build:
//
// - replace all instances of `http://localhost:8000` to `https://classfast.app`
// - remove the api key from the manifest.json file, because the chrome web
//   store handles that separately
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
          transform(buf) {
            const data = JSON.parse(buf.toString("utf8"));
            delete data["key"];
            data["oauth2"]["client_id"] =
              "850669494212-rbi5f45edqpnru9a7gs1avgb480kr92b.apps.googleusercontent.com";
            return Buffer.from(JSON.stringify(data));
          },
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
