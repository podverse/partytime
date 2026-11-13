import { buildSync } from "esbuild";

type MetafileOutput = {
  imports: Array<{ path: string; external?: boolean }>;
};

describe("core entry portability", () => {
  it("bundles for neutral platform without node-only dependencies", () => {
    const result = buildSync({
      entryPoints: ["src/core.ts"],
      bundle: true,
      platform: "neutral",
      format: "cjs",
      packages: "external",
      metafile: true,
      write: false,
      outfile: "out.js",
      logLevel: "silent",
    });

    const metafile = result.metafile;
    expect(metafile).toBeDefined();
    if (!metafile) {
      return;
    }

    const output = Object.values(metafile.outputs)[0] as MetafileOutput | undefined;
    const externalImports = (output?.imports ?? [])
      .filter((entry) => entry.external)
      .map((entry) => entry.path);

    externalImports.forEach((importPath) => {
      const isAllowed =
        importPath === "fast-xml-parser" ||
        importPath === "he" ||
        importPath === "tiny-invariant" ||
        /^ramda\/src\/[^/]+$/.test(importPath);
      expect(isAllowed).toBe(true);
    });

    const inputPaths = Object.keys(metafile.inputs);
    inputPaths.forEach((inputPath) => {
      expect(inputPath.endsWith("src/config.ts")).toBe(false);
      expect(inputPath.endsWith("src/node-setup.ts")).toBe(false);
      expect(inputPath.endsWith("src/shared.ts")).toBe(false);
      expect(inputPath.includes("src/cor/")).toBe(false);
    });

    const bundledText = result.outputFiles[0]?.text ?? "";
    expect(/\bBuffer\.(from|byteLength|alloc)/.test(bundledText)).toBe(false);
    expect(/\bprocess\.env\b/.test(bundledText)).toBe(false);
    expect(/\btypeof process\b/.test(bundledText)).toBe(false);
  });
});
