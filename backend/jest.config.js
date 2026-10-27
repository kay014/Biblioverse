module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["controllers/**/*.js", "services/**/*.js"],
  testTimeout: 30000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  setupFiles: ["<rootDir>/tests/setupTests.js"],
};
