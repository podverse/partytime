import { parseFeed } from "../index";

/**
 * Tests for XML entity expansion limit (issue #140).
 * The parser allows more than the default 1000 expansions so that feeds with many
 * entities (e.g. fountain.fm with 1064) parse successfully, while still capping
 * to avoid XML bomb attacks.
 */
describe("entity expansion limit", () => {
  const minimalRssPrefix = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Entity expansion test</title>
    <item>
      <title>Item</title>
      <description>`;

  const minimalRssSuffix = `</description>
      <enclosure url="https://example.com/ep.mp3" length="1000" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;

  it("parses RSS with more than 1000 entity expansions", () => {
    // Each &amp; is one entity expansion. 1001 exceeds the default limit of 1000.
    const entityRef = "&amp; ";
    const count = 1001;
    const descriptionContent = entityRef.repeat(count);
    const xml = minimalRssPrefix + descriptionContent + minimalRssSuffix;

    const result = parseFeed(xml, { allowMissingGuid: true });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("title", "Entity expansion test");
    expect(result?.items).toHaveLength(1);
    expect(result?.items?.[0]).toHaveProperty("title", "Item");
  });

  it("parses RSS with more than 50000 entity expansions", () => {
    const entityRef = "&amp; ";
    const count = 50001;
    const descriptionContent = entityRef.repeat(count);
    const xml = minimalRssPrefix + descriptionContent + minimalRssSuffix;

    const result = parseFeed(xml, { allowMissingGuid: true });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("title", "Entity expansion test");
    expect(result?.items).toHaveLength(1);
    expect(result?.items?.[0]).toHaveProperty("title", "Item");
  });

  it("does not count deprecated itunes:summary entities when description exists", () => {
    const entityRef = "&lt;p&gt;&quot;hello&quot;&lt;/p&gt;";
    const count = 100001;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Entity expansion test</title>
    <description>Channel description</description>
    <itunes:summary>${entityRef.repeat(count)}</itunes:summary>
    <item>
      <title>Item</title>
      <description>Item description</description>
      <itunes:summary>${entityRef.repeat(count)}</itunes:summary>
      <enclosure url="https://example.com/ep.mp3" length="1000" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;

    const result = parseFeed(xml, { allowMissingGuid: true });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("description", "Channel description");
    expect(result).not.toHaveProperty("summary");
    expect(result?.items?.[0]).toHaveProperty("description", "Item description");
    expect(result?.items?.[0]).not.toHaveProperty("summary");
  });

  it("still rejects too many entities outside deprecated itunes:summary", () => {
    const entityRef = "&amp; ";
    const count = 100001;
    const descriptionContent = entityRef.repeat(count);
    const xml = minimalRssPrefix + descriptionContent + minimalRssSuffix;

    expect(() => parseFeed(xml, { allowMissingGuid: true })).toThrow(
      "Entity expansion count limit exceeded"
    );
  });
});
