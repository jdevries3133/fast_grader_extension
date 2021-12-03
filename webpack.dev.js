const { merge } = require("webpack-merge");
const replace = require("buffer-replace");
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
            data[
              "content_security_policy"
            ] = `"content_security_policy": "script-src 'self' 'unsafe-eval'`;
            data["oauth2"]["client_id"] =
              "568001308128-19ol41cg8ujnb44s2m459ps4of8tlqmt.apps.googleusercontent.com";
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
