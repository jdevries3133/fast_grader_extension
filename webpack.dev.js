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
            const src = `"content_security_policy": "script-src 'self'`;
            const target = `"content_security_policy": "script-src 'self' 'unsafe-eval'`;
            return replace(buf, src, target);
          },
        },
      ],
    }),
  ],
});
