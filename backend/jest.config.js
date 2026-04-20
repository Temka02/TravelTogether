module.exports = {
  testEnvironment: "node",
  verbose: true,
  collectCoverageFrom: [
    "src/**/*.js",
    "config/**/*.js",
    "utils/**/*.js",
    "middleware/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!src/utils/createAdmin.js",
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ["./tests/helpers/setup.js"],
  testTimeout: 30000,
};
