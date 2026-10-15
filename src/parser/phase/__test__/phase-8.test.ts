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

  describe("podcast:image", () => {
    const supportedName = "image";

    it("skips missing tag", () => {
      const result = helpers.parseValidFeed(feed);

      expect(result).not.toHaveProperty("podcastImage");
      expect(result.items[0]).not.toHaveProperty("podcastImage");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("ignores missing href", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:image type="image/jpeg" width="1400" height="1400"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastImage");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("extracts multiple channel images", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:image href="https://example.com/square.jpg" alt="Square art" aspect-ratio="1/1" type="image/jpeg" width="1400" height="1400" purpose="artwork"/>
        <podcast:image href="https://example.com/banner.jpg" aspect-ratio="16/9" width="1920" purpose="artwork social"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).toHaveProperty("podcastImage");
      expect(result.podcastImage).toHaveLength(2);
      expect(result.podcastImage?.[0]).toEqual({
        href: "https://example.com/square.jpg",
        alt: "Square art",
        aspectRatio: "1/1",
        type: "image/jpeg",
        width: 1400,
        height: 1400,
        purpose: "artwork",
      });
      expect(result.podcastImage?.[1]).toEqual({
        href: "https://example.com/banner.jpg",
        aspectRatio: "16/9",
        width: 1920,
        purpose: "artwork social",
      });
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts item images", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:image href="https://example.com/episode.mp4" type="video/mp4" aspect-ratio="9/16" width="1200" purpose="canvas"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastImage");
      expect(result.items[0].podcastImage).toHaveLength(1);
      expect(result.items[0].podcastImage?.[0]).toEqual({
        href: "https://example.com/episode.mp4",
        type: "video/mp4",
        aspectRatio: "9/16",
        width: 1200,
        purpose: "canvas",
      });
      expect(result.items[1]).not.toHaveProperty("podcastImage");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("filters item images without href while keeping valid images", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `<podcast:image type="image/jpeg" width="1400" height="1400"/>
        <podcast:image href="https://example.com/item-valid.jpg" type="image/jpeg" width="1400" height="1400"/>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result.items[0]).toHaveProperty("podcastImage");
      expect(result.items[0].podcastImage).toEqual([
        {
          href: "https://example.com/item-valid.jpg",
          type: "image/jpeg",
          width: 1400,
          height: 1400,
        },
      ]);
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts liveItem images", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:liveItem status="live" start="2021-09-26T07:30:00.000-0600" end="2021-09-26T08:30:00.000-0600">
          <title>Live Episode</title>
          <guid>live-episode</guid>
          <enclosure url="https://example.com/live.mp3" length="1234" type="audio/mpeg"/>
          <podcast:image href="https://example.com/live.jpg" alt="Live art" aspect-ratio="16/9"/>
        </podcast:liveItem>`
      );
      const result = helpers.parseValidFeed(xml);

      expect(result.podcastLiveItems).toHaveLength(1);
      expect(result.podcastLiveItems?.[0]).toHaveProperty("podcastImage");
      expect(result.podcastLiveItems?.[0].podcastImage).toEqual([
        {
          href: "https://example.com/live.jpg",
          alt: "Live art",
          aspectRatio: "16/9",
        },
      ]);
    });
  });
});
