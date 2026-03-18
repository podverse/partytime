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
});
