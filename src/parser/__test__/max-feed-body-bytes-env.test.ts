/* eslint-disable global-require -- jest.resetModules() needs fresh require() after env changes */
/* eslint-disable @typescript-eslint/no-var-requires -- intentional require() after resetModules */
describe("PARSER_MAX_FEED_BODY_BYTES env", () => {
  const originalEnv = process.env.PARSER_MAX_FEED_BODY_BYTES;

  afterEach(() => {
    jest.resetModules();
    if (originalEnv === undefined) {
      delete process.env.PARSER_MAX_FEED_BODY_BYTES;
    } else {
      process.env.PARSER_MAX_FEED_BODY_BYTES = originalEnv;
    }
  });

  it("applies limit from env when options omit maxFeedBodyBytes", () => {
    jest.resetModules();
    process.env.PARSER_MAX_FEED_BODY_BYTES = "2500";
    const { parseFeed } = require("../index") as typeof import("../index");
    const prefix = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>`;
    const suffix = `</title></channel></rss>`;
    const fixed = Buffer.byteLength(prefix, "utf8") + Buffer.byteLength(suffix, "utf8");
    const xmlTooLarge = prefix + "x".repeat(3000 - fixed) + suffix;
    expect(Buffer.byteLength(xmlTooLarge, "utf8")).toBe(3000);
    expect(parseFeed(xmlTooLarge)).toBeNull();

    const xmlOk = prefix + "y".repeat(2000 - fixed) + suffix;
    expect(Buffer.byteLength(xmlOk, "utf8")).toBe(2000);
    expect(parseFeed(xmlOk)).not.toBeNull();
  });

  it("ParserOptions.maxFeedBodyBytes overrides env", () => {
    jest.resetModules();
    process.env.PARSER_MAX_FEED_BODY_BYTES = "1500";
    const { parseFeed } = require("../index") as typeof import("../index");
    const prefix = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>`;
    const suffix = `</title></channel></rss>`;
    const fixed = Buffer.byteLength(prefix, "utf8") + Buffer.byteLength(suffix, "utf8");
    const xml = prefix + "z".repeat(4000 - fixed) + suffix;
    expect(Buffer.byteLength(xml, "utf8")).toBe(4000);
    expect(parseFeed(xml, { maxFeedBodyBytes: 8000 })).not.toBeNull();
  });

  it("throws when PARSER_MAX_FEED_BODY_BYTES is invalid", () => {
    jest.resetModules();
    process.env.PARSER_MAX_FEED_BODY_BYTES = "not-a-number";
    expect(() => {
      require("../../config");
    }).toThrow(/PARSER_MAX_FEED_BODY_BYTES/);
  });
});
