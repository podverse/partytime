import { DEFAULT_MAX_FEED_BODY_BYTES } from "../../config";
import { parseFeed } from "../index";

const RSS_PREFIX = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>`;
const RSS_SUFFIX = `</title></channel></rss>`;

function buildRssWithTitlePayload(payload: string): string {
  return RSS_PREFIX + payload + RSS_SUFFIX;
}

function byteLengthOfRssTemplate(): number {
  return Buffer.byteLength(RSS_PREFIX, "utf8") + Buffer.byteLength(RSS_SUFFIX, "utf8");
}

describe("max feed body bytes", () => {
  jest.setTimeout(60_000);

  it("parses feed at exactly the default max UTF-8 size", () => {
    const fixed = byteLengthOfRssTemplate();
    const payloadLen = DEFAULT_MAX_FEED_BODY_BYTES - fixed;
    const xml = buildRssWithTitlePayload("a".repeat(payloadLen));
    expect(Buffer.byteLength(xml, "utf8")).toBe(DEFAULT_MAX_FEED_BODY_BYTES);
    const result = parseFeed(xml);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("title");
  });

  it("returns null when feed exceeds the default max UTF-8 size", () => {
    const fixed = byteLengthOfRssTemplate();
    const payloadLen = DEFAULT_MAX_FEED_BODY_BYTES + 1 - fixed;
    const xml = buildRssWithTitlePayload("b".repeat(payloadLen));
    expect(Buffer.byteLength(xml, "utf8")).toBe(DEFAULT_MAX_FEED_BODY_BYTES + 1);
    expect(parseFeed(xml)).toBeNull();
  });

  it("honors maxFeedBodyBytes when set below the document UTF-8 length", () => {
    const fixed = byteLengthOfRssTemplate();
    const targetBytes = 2000;
    const xml = buildRssWithTitlePayload("c".repeat(targetBytes - fixed));
    const len = Buffer.byteLength(xml, "utf8");
    expect(len).toBe(targetBytes);
    expect(parseFeed(xml, { maxFeedBodyBytes: len - 1 })).toBeNull();
    expect(parseFeed(xml, { maxFeedBodyBytes: len })).not.toBeNull();
  });
});
