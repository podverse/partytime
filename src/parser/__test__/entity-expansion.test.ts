import { parseFeed } from "../index";
import { parse } from "../xml-parser";

/**
 * Predefined XML entities in show notes are unlimited. Expansion limits apply
 * only to DOCTYPE-defined entities.
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

  it("parses RSS with more than 1000 predefined entity expansions", () => {
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

  it("parses RSS with more than 100000 predefined entity expansions", () => {
    const entityRef = "&amp; ";
    const count = 100001;
    const descriptionContent = entityRef.repeat(count);
    const xml = minimalRssPrefix + descriptionContent + minimalRssSuffix;

    const result = parseFeed(xml, { allowMissingGuid: true });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("title", "Entity expansion test");
    expect(result?.items).toHaveLength(1);
    expect(result?.items?.[0]).toHaveProperty("title", "Item");
  });

  it("rejects many expansions of a DOCTYPE-defined entity", () => {
    const refs = "&x;".repeat(1001);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE rss [
  <!ENTITY x "AAAAAAAAAA">
]>
<rss version="2.0">
  <channel>
    <title>${refs}</title>
  </channel>
</rss>`;

    expect(() => {
      parse(xml);
    }).toThrow(/Entity expansion count limit exceeded/);
  });
});
