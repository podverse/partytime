import * as fs from "fs";
import * as path from "path";

import { exceedsUtf8ByteLimit, utf8ByteLength } from "../utf8";

function listFixtureXmlFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFixtureXmlFiles(entryPath);
    }
    return entry.name.endsWith(".xml") ? [entryPath] : [];
  });
}

describe("utf8 byte length helpers", () => {
  it("matches Buffer.byteLength for key text cases", () => {
    const cases = ["abc", "é", "€", "😀", "\ud83d", "\ude00", ""];

    cases.forEach((text) => {
      expect(utf8ByteLength(text)).toBe(Buffer.byteLength(text, "utf8"));
    });
  });

  it("matches Buffer.byteLength for fixture xml files", () => {
    const fixturesDir = path.resolve(__dirname, "fixtures");
    const fixturePaths = listFixtureXmlFiles(fixturesDir);

    fixturePaths.forEach((fixturePath) => {
      const xml = fs.readFileSync(fixturePath, "utf-8");
      expect(utf8ByteLength(xml)).toBe(Buffer.byteLength(xml, "utf8"));
    });
  });

  it("treats equal boundary as within the limit", () => {
    const text = "abc😀";
    const limit = Buffer.byteLength(text, "utf8");
    expect(exceedsUtf8ByteLimit(text, limit)).toBe(false);
  });

  it("returns true when one byte over the limit", () => {
    const text = "abc😀";
    const limit = Buffer.byteLength(text, "utf8") - 1;
    expect(exceedsUtf8ByteLimit(text, limit)).toBe(true);
  });

  it("uses the short-circuit true path when code units exceed the limit", () => {
    expect(exceedsUtf8ByteLimit("abcd", 3)).toBe(true);
  });

  it("uses the short-circuit false path when the upper bound fits the limit", () => {
    expect(exceedsUtf8ByteLimit("abcd", 12)).toBe(false);
  });
});
