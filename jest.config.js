const { defaults } = require("jest-config");

module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/*.js", ...defaults.testMatch],
  setupFiles: ["<rootDir>/jestSetup.js"],
  setupFilesAfterEnv: ["<rootDir>/jestSetupAfterEnv.js"],
};
