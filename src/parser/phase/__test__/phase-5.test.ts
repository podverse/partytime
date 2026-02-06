/* eslint-disable sonarjs/no-duplicate-string */
import * as helpers from "../../__test__/helpers";
import { Phase5Blocked, isSafeToIngest, isServiceBlocked } from "../phase-5";

const phase = 5;

describe("phase 5", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("socialInteract", () => {
    const supportedName = "socialInteract";

    describe("channel-level (channelPodcastSocialInteract)", () => {
      it("extracts channel podcast:socialInteract with spec attributes", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
    <podcast:socialInteract protocol="activitypub" uri="https://podcastindex.social/@mitch/116024949309724989" accountId="@mitch" accountUrl="https://podcastindex.social/@mitch" priority="1"/>
          `
        );
        const result = helpers.parseValidFeed(xml);

        expect(result).toHaveProperty("channelPodcastSocialInteract");
        expect(result.channelPodcastSocialInteract).toHaveLength(1);
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty("platform", "activitypub");
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty("id", "@mitch");
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty(
          "url",
          "https://podcastindex.social/@mitch/116024949309724989"
        );
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty(
          "profileUrl",
          "https://podcastindex.social/@mitch"
        );
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty("priority", 1);

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("has no channelPodcastSocialInteract when channel has no podcast:socialInteract", () => {
        const xml = helpers.spliceFeed(feed, "");
        const result = helpers.parseValidFeed(xml);
        expect(result).not.toHaveProperty("channelPodcastSocialInteract");
      });

      it("extracts multiple channel socialInteract tags", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
    <podcast:socialInteract protocol="activitypub" uri="https://example.com/post/1" accountId="@user" priority="1"/>
    <podcast:socialInteract protocol="twitter" uri="https://twitter.com/user/status/1" accountId="@user" priority="2"/>
          `
        );
        const result = helpers.parseValidFeed(xml);

        expect(result.channelPodcastSocialInteract).toHaveLength(2);
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty("platform", "activitypub");
        expect(result.channelPodcastSocialInteract?.[0]).toHaveProperty(
          "url",
          "https://example.com/post/1"
        );
        expect(result.channelPodcastSocialInteract?.[1]).toHaveProperty("platform", "twitter");
        expect(result.channelPodcastSocialInteract?.[1]).toHaveProperty("priority", 2);
      });
    });

    it("extracts a single interact node", () => {
      const xml = helpers.spliceFirstItem(
        feed,
        `
          <podcast:socialInteract
            platform="twitter"
            podcastAccountId="@Podverse"
            priority="2"
            pubDate="2021-04-14T10:25:42Z">https://twitter.com/Podverse/status/1375624446296395781</podcast:socialInteract>
          `
      );
      const result = helpers.parseValidFeed(xml);

      expect(result).not.toHaveProperty("podcastSocialInteraction");
      const [first] = result.items;

      expect(first).toHaveProperty("podcastSocialInteraction");
      expect(first.podcastSocialInteraction).toHaveLength(1);

      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("platform", "twitter");
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("id", "@Podverse");
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty("priority", 2);
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty(
        "pubDate",
        new Date("2021-04-14T10:25:42Z")
      );
      expect(first.podcastSocialInteraction?.[0]).toHaveProperty(
        "url",
        "https://twitter.com/Podverse/status/1375624446296395781"
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("block", () => {
    const supportedName = "block";

    it("defaults to false", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);
    });
    it("handles explicit false", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>no</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);
    });
    it("handles explicit true", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>yes</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.Yes);
      expect(isSafeToIngest(result, "podverse")).toBe(false);
      expect(isSafeToIngest(result, "google")).toBe(false);
      expect(isSafeToIngest(result, "amazon")).toBe(false);

      expect(isServiceBlocked(result, "podverse")).toBe(true);
      expect(isServiceBlocked(result, "google")).toBe(true);
      expect(isServiceBlocked(result, "amazon")).toBe(true);
    });
    it("only blocks google and amazon", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block id="google">yes</podcast:block>
        <podcast:block id="amazon">yes</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.No);
      expect(result.podcastBlockedPlatforms).toHaveProperty("google", true);
      expect(result.podcastBlockedPlatforms).toHaveProperty("amazon", true);

      expect(isSafeToIngest(result, "podverse")).toBe(true);
      expect(isSafeToIngest(result, "google")).toBe(false);
      expect(isSafeToIngest(result, "amazon")).toBe(false);

      expect(isServiceBlocked(result, "podverse")).toBe(false);
      expect(isServiceBlocked(result, "google")).toBe(true);
      expect(isServiceBlocked(result, "amazon")).toBe(true);
    });
    it("blocks everything except google and amazon", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:block>yes</podcast:block>
        <podcast:block id="google">no</podcast:block>
        <podcast:block id="amazon">no</podcast:block>
        `
      );
      const result = helpers.parseValidFeed(xml);
      expect(result.podcastBlocked).toEqual(Phase5Blocked.Yes);
      expect(result.podcastBlockedPlatforms).toHaveProperty("google", false);
      expect(result.podcastBlockedPlatforms).toHaveProperty("amazon", false);

      expect(isSafeToIngest(result, "podverse")).toBe(false);
      expect(isSafeToIngest(result, "google")).toBe(true);
      expect(isSafeToIngest(result, "amazon")).toBe(true);

      expect(isServiceBlocked(result, "podverse")).toBe(true);
      expect(isServiceBlocked(result, "google")).toBe(false);
      expect(isServiceBlocked(result, "amazon")).toBe(false);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });
});
