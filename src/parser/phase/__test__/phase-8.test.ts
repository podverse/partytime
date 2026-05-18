/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as helpers from "../../__test__/helpers";

const phase = 8;

describe("phase 8", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("podcast:follow", () => {
    const supportedName = "follow";

    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("podcastFollow");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("ignores missing url", () => {
      const xml = helpers.spliceFeed(feed, `<podcast:follow/>`);
      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastFollow");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("extracts a PRX follow url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:follow url="https://f.prxu.org/72/subscribelinks.json"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFollow");
      expect(result.podcastFollow).toHaveProperty(
        "url",
        "https://f.prxu.org/72/subscribelinks.json"
      );
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts a Podnews follow url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:follow url="https://podnews.net/podcast/i8xe9/follow.json"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFollow");
      expect(result.podcastFollow).toHaveProperty(
        "url",
        "https://podnews.net/podcast/i8xe9/follow.json"
      );
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts an insecure HTTP follow url", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:follow url="http://example.com/follow.json"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFollow");
      expect(result.podcastFollow).toHaveProperty("url", "http://example.com/follow.json");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("handles multiple follow tags by taking the first one", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:follow url="https://example.com/first.json"/>
        <podcast:follow url="https://example.com/second.json"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFollow");
      expect(result.podcastFollow).toHaveProperty("url", "https://example.com/first.json");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("handles multiple follow tags by taking the first valid one", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:follow url=""/>
        <podcast:follow url="not a url"/>
        <podcast:follow url="https://example.com/valid.json"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastFollow");
      expect(result.podcastFollow).toHaveProperty("url", "https://example.com/valid.json");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("ignores empty or whitespace-only url values", () => {
      const empty = helpers.spliceFeed(feed, `<podcast:follow url=""/>`);
      const whitespace = helpers.spliceFeed(feed, `<podcast:follow url="   "/>`);

      expect(helpers.parseValidFeed(empty)).not.toHaveProperty("podcastFollow");
      expect(helpers.parseValidFeed(whitespace)).not.toHaveProperty("podcastFollow");
    });

    it("ignores malformed and unsupported url values", () => {
      const malformed = helpers.spliceFeed(feed, `<podcast:follow url="not a url"/>`);
      const unsupported = helpers.spliceFeed(
        feed,
        `<podcast:follow url="ftp://example.com/feed"/>`
      );

      expect(helpers.parseValidFeed(malformed)).not.toHaveProperty("podcastFollow");
      expect(helpers.getPhaseSupport(helpers.parseValidFeed(malformed), phase)).not.toContain(
        supportedName
      );
      expect(helpers.parseValidFeed(unsupported)).not.toHaveProperty("podcastFollow");
      expect(helpers.getPhaseSupport(helpers.parseValidFeed(unsupported), phase)).not.toContain(
        supportedName
      );
    });
  });
});
