const path = require("path");
const { buildSync } = require("esbuild");

// he ships only as an ES module, and Jest's CommonJS runtime cannot require() one. Tests load
// this CommonJS bundle in its place (see moduleNameMapper); Node loads the real package.
module.exports = function bundleHe() {
  buildSync({
    entryPoints: [require.resolve("he")],
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: path.join(__dirname, "../../.jest/he.js"),
    logLevel: "error",
  });
};
