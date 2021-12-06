const fs = require("fs");

const { merge } = require("webpack-merge");
const CopyPlugin = require("copy-webpack-plugin");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "./src/manifest.json",
          to: "manifest.json",
          transform(buf) {
            const data = JSON.parse(buf.toString("utf8"));
            data["content_security_policy"] =
              "script-src 'self' 'unsafe-eval'; object-src 'self'";
            data["oauth2"]["client_id"] =
              "568001308128-19ol41cg8ujnb44s2m459ps4of8tlqmt.apps.googleusercontent.com";
            const key = fs
              .readFileSync("private_key.pem", "utf8")
              .replace("-----BEGIN PRIVATE KEY-----", "")
              .replace("-----END PRIVATE KEY-----", "")
              .replaceAll("\n", "")
              .trim();
            data["key"] = key;
            return Buffer.from(JSON.stringify(data));
          },
        },
        {
          from: "./src/*.html",
          to: "[name].html",
        },
      ],
    }),
  ],
});
