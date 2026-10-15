module.exports = {
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "\\.(ts)$": "esbuild-runner/jest",
  },
  globalSetup: "<rootDir>/scripts/jest/bundle-he.js",
  moduleNameMapper: {
    "^he$": "<rootDir>/.jest/he.js",
  },
  cacheDirectory: ".jest/cache",
  testMatch: ["**/*.test.(ts|js)"],
  testEnvironment: "node",
  testTimeout: 10_000,
};
