import { parseFeed } from "..";

import * as helpers from "./helpers";
import list from "./fixtures/real-world/list.json";

describe("real-world feeds", () => {
  (list as Array<{ uri: string; file: string; title: string }>).forEach((item) => {
    it(`parses captured feed for ${item.file} - ${item.uri}`, async () => {
      const xml = await helpers.loadFixture(`real-world/${item.file}`);
      const result = parseFeed(xml);

      expect(result).toHaveProperty("title", item.title);
    });
  });

  describe("Changing the Tide", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/changing-the-tide.xml`);
    });

    it(`parses all items`, () => {
      const result = parseFeed(xml);

      expect(result.items).toHaveLength(15);
    });

    it(`handles querystring enclosure urls`, () => {
      const expectedUrl =
        "https://t.subsplash.com/r/aHR0cHM6Ly9jZG4uc3Vic3BsYXNoLmNvbS9hdWRpb3MvR0JNOTlTLzBhYTU3OTYxLWZhM2QtNGM1Yi04ZmVjLTllOGRmNDM4OTVjZC9hdWRpby5tcDM.mp3?k=GBM99S&s=3&sapid=67bxc3f";
      const result = parseFeed(xml);
      const exampleEpisode = result.items.find((ep) => ep.title === "0.00000014: 8₿it, BTC.email");
      expect(exampleEpisode).toHaveProperty("enclosure");
      expect(exampleEpisode.enclosure).toHaveProperty("url", expectedUrl);
    });
  });

  // This feed has missing GUIDs while I don't think this should be encouraged, it can be allowed via options
  describe("DK Podcast", () => {
    let xml = "";
    beforeEach(async () => {
      xml = await helpers.loadFixture(`real-world/dk-podcast.xml`);
    });

    it(`parses all items with GUID missing flag allowed`, () => {
      const result = parseFeed(xml, { allowMissingGuid: true });

      expect(result.items).toHaveLength(59);
    });

    it(`parses no items with GUID missing flag disabled`, () => {
      const result = parseFeed(xml, { allowMissingGuid: false });

      expect(result.items).toHaveLength(0);
    });
  });
});
