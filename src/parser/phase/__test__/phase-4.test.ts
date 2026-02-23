/* eslint-disable sonarjs/no-duplicate-string */
import invariant from "tiny-invariant";

import * as helpers from "../../__test__/helpers";
import { Episode, FeedObject } from "../../types";
import { Phase4LiveStatus, Phase4Medium } from "../phase-4";

const phase = 4;

describe("phase 4", () => {
  let feed;
  beforeAll(async () => {
    feed = await helpers.loadSimple();
  });

  describe("value", () => {
    const supportedName = "value";

    const assertAlice = (alice): void => {
      expect(alice).toHaveProperty("name", "Alice (Podcaster)");
      expect(alice).toHaveProperty("type", "node");
      expect(alice).toHaveProperty(
        "address",
        "02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
      );
      expect(alice).toHaveProperty("split", 40);
      expect(alice).toHaveProperty("fee", false);
    };
    const assertBob = (bob): void => {
      expect(bob).toHaveProperty("name", "Bob (Podcaster)");
      expect(bob).toHaveProperty("type", "node");
      expect(bob).toHaveProperty(
        "address",
        "032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
      );
      expect(bob).toHaveProperty("split", 40);
      expect(bob).toHaveProperty("fee", false);
    };
    const assertCarol = (carol): void => {
      expect(carol).toHaveProperty("name", "Carol (Producer)");
      expect(carol).toHaveProperty("type", "node");
      expect(carol).toHaveProperty(
        "address",
        "02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
      );
      expect(carol).toHaveProperty("split", 15);
      expect(carol).toHaveProperty("fee", false);
    };
    const assertHost = (host): void => {
      expect(host).toHaveProperty("name", "Hosting Provider");
      expect(host).toHaveProperty("type", "node");
      expect(host).toHaveProperty(
        "address",
        "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a"
      );
      expect(host).toHaveProperty("split", 5);
      expect(host).toHaveProperty("fee", true);
    };

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);
      invariant(result);

      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("allows for a feed level block", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
            name="Bob (Podcaster)"
            type="node"
            address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
            split="40"
        />
        <podcast:valueRecipient
            name="Carol (Producer)"
            type="node"
            address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
            split="15"
        />
        <podcast:valueRecipient
            name="Hosting Provider"
            type="node"
            address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a"
            split="5"
            fee="true"
        />
      </podcast:value>
      `
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        const v = block.values?.[0];
        expect(v).toHaveProperty("type", "lightning");
        expect(v).toHaveProperty("method", "keysend");
        expect(v).toHaveProperty("suggested", 0.00000015);
        invariant(v);

        expect(v.recipients).toHaveLength(4);

        const [r1, r2, r3, r4] = v.recipients;
        assertAlice(r1);
        assertBob(r2);
        assertCarol(r3);
        assertHost(r4);
      };

      const result = helpers.parseValidFeed(xml);
      invariant(result);
      expect(result.values).toHaveLength(1);
      assertBlockProperties(result);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("prioritizes item level blocks", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
      </podcast:value>
      `
      );

      const result = helpers.parseValidFeed(
        helpers.spliceFirstItem(
          xml,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
        name="Bob (Podcaster)"
        type="node"
        address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
        split="40"
    />
      </podcast:value>
      `
        )
      );
      invariant(result);

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        const v = block.values?.[0];
        expect(v).toHaveProperty("type", "lightning");
        expect(v).toHaveProperty("method", "keysend");
        expect(v).toHaveProperty("suggested", 0.00000015);
      };

      expect(result.values).toHaveLength(1);
      assertBlockProperties(result);
      expect(result.values?.[0]?.recipients).toHaveLength(1);
      assertAlice(result.values?.[0]?.recipients[0]);

      const [first, second, third] = result.items;
      expect(first.values).toHaveLength(1);
      assertBlockProperties(first);
      expect(first.values?.[0]?.recipients).toHaveLength(2);
      assertAlice(first.values?.[0]?.recipients[0]);
      assertBob(first.values?.[0]?.recipients[1]);

      expect(second.values).toHaveLength(1);
      assertBlockProperties(second);
      expect(second.values?.[0]?.recipients).toHaveLength(1);
      assertAlice(second.values?.[0]?.recipients[0]);

      expect(third.values).toHaveLength(1);
      assertBlockProperties(third);
      expect(third.values?.[0]?.recipients).toHaveLength(1);
      assertAlice(third.values?.[0]?.recipients[0]);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("allows for only item level blocks", () => {
      const result = helpers.parseValidFeed(
        helpers.spliceFirstItem(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.1">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
        name="Bob (Podcaster)"
        type="node"
        address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
        split="40"
    />
      </podcast:value>
      `
        )
      );
      invariant(result);

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        const v = block.values?.[0];
        expect(v).toHaveProperty("type", "lightning");
        expect(v).toHaveProperty("method", "keysend");
        expect(v).toHaveProperty("suggested", 0.1);
      };

      expect(result.values).toBeUndefined();

      const [first, second, third] = result.items;
      expect(first.values).toHaveLength(1);
      assertBlockProperties(first);
      expect(first.values?.[0]?.recipients).toHaveLength(2);
      assertAlice(first.values?.[0]?.recipients[0]);
      assertBob(first.values?.[0]?.recipients[1]);

      expect(second.values).toBeUndefined();

      expect(third.values).toBeUndefined();

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("falls back to feed block", () => {
      const xml = helpers.spliceFeed(
        feed,
        `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
        <podcast:valueRecipient
            name="Bob (Podcaster)"
            type="node"
            address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
            split="40"
        />
        <podcast:valueRecipient
            name="Carol (Producer)"
            type="node"
            address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
            split="15"
        />
      </podcast:value>
      `
      );

      const assertBlockProperties = (block: FeedObject | Episode): void => {
        const v = block.values?.[0];
        expect(v).toHaveProperty("type", "lightning");
        expect(v).toHaveProperty("method", "keysend");
        expect(v).toHaveProperty("suggested", 0.00000015);

        expect(v?.recipients).toHaveLength(3);

        const [r1, r2, r3] = v?.recipients ?? [];
        assertAlice(r1);
        assertBob(r2);
        assertCarol(r3);
      };

      const result = helpers.parseValidFeed(xml);
      invariant(result);
      expect(result.values).toHaveLength(1);

      const [first, second, third] = result.items;
      expect(first.values).toHaveLength(1);
      assertBlockProperties(first);
      expect(second.values).toHaveLength(1);
      assertBlockProperties(second);
      expect(third.values).toHaveLength(1);
      assertBlockProperties(third);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    describe("multiple value blocks", () => {
      it("parses multiple feed-level podcast:value blocks into values array", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
      </podcast:value>
      <podcast:value type="lightning" method="lnaddress" suggested="0.00000020000">
        <podcast:valueRecipient
            name="Alice LN"
            type="lnaddress"
            address="alice@example.com"
            split="100"
        />
      </podcast:value>
      `
        );

        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result.values).toHaveLength(2);

        const [keysendBlock, lnaddressBlock] = result.values ?? [];
        expect(keysendBlock).toHaveProperty("type", "lightning");
        expect(keysendBlock).toHaveProperty("method", "keysend");
        expect(keysendBlock).toHaveProperty("suggested", 0.00000015);
        expect(keysendBlock.recipients).toHaveLength(1);
        expect(keysendBlock.recipients[0]).toHaveProperty("type", "node");
        expect(keysendBlock.recipients[0]).toHaveProperty("name", "Alice (Podcaster)");

        expect(lnaddressBlock).toHaveProperty("type", "lightning");
        expect(lnaddressBlock).toHaveProperty("method", "lnaddress");
        expect(lnaddressBlock).toHaveProperty("suggested", 0.0000002);
        expect(lnaddressBlock.recipients).toHaveLength(1);
        expect(lnaddressBlock.recipients[0]).toHaveProperty("type", "lnaddress");
        expect(lnaddressBlock.recipients[0]).toHaveProperty("address", "alice@example.com");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("parses multiple item-level podcast:value blocks into values array", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient name="Alice" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="40" />
      </podcast:value>
      `
        );
        const xmlWithTwoItemValues = helpers.spliceFirstItem(
          xml,
          `<podcast:value type="lightning" method="keysend" suggested="0.1">
        <podcast:valueRecipient name="Alice" type="node" address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52" split="50" />
      </podcast:value>
      <podcast:value type="lightning" method="lnaddress" suggested="0.15">
        <podcast:valueRecipient name="Bob LN" type="lnaddress" address="bob@example.com" split="100" />
      </podcast:value>
      `
        );

        const result = helpers.parseValidFeed(xmlWithTwoItemValues);
        invariant(result);

        const [firstItem] = result.items;
        invariant(firstItem);
        expect(firstItem.values).toHaveLength(2);

        const [itemKeysend, itemLnaddress] = firstItem.values ?? [];
        expect(itemKeysend).toHaveProperty("method", "keysend");
        expect(itemKeysend.recipients[0]).toHaveProperty("type", "node");
        expect(itemLnaddress).toHaveProperty("method", "lnaddress");
        expect(itemLnaddress.recipients[0]).toHaveProperty("type", "lnaddress");
        expect(itemLnaddress.recipients[0]).toHaveProperty("address", "bob@example.com");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("single value block populates values array", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="40"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result.values).toHaveLength(1);
        expect(result.values?.[0]).toHaveProperty("method", "keysend");
      });
    });

    describe("metaBoost", () => {
      it("parses podcast:metaBoost on feed-level value block", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:metaBoost type="lightning" schema="boostbox">http://localhost:8080/boost</podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        invariant(result.values?.[0]);

        expect(result.values?.[0].metaBoost).toBeDefined();
        expect(result.values?.[0].metaBoost).toHaveProperty("type", "lightning");
        expect(result.values?.[0].metaBoost).toHaveProperty("schema", "boostbox");
        expect(result.values?.[0].metaBoost).toHaveProperty("node", "http://localhost:8080/boost");
        expect(result.values?.[0].metaBoost).not.toHaveProperty("license");
      });

      it("parses podcast:metaBoost with optional license attribute", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:metaBoost type="lightning" schema="boostbox" license="MIT">https://boost.example.com/boost</podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        invariant(result.values?.[0]);

        expect(result.values?.[0].metaBoost).toHaveProperty("license", "MIT");
        expect(result.values?.[0].metaBoost).toHaveProperty(
          "node",
          "https://boost.example.com/boost"
        );
      });

      it("parses podcast:metaBoost on item-level value block", () => {
        const xml = helpers.spliceFirstItem(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.1">
        <podcast:metaBoost type="lightning" schema="boostbox">http://localhost:8080/boost</podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        const [firstItem] = result.items;
        invariant(firstItem.values?.[0]);

        expect(firstItem.values?.[0].metaBoost).toBeDefined();
        expect(firstItem.values?.[0].metaBoost).toHaveProperty("type", "lightning");
        expect(firstItem.values?.[0].metaBoost).toHaveProperty("schema", "boostbox");
        expect(firstItem.values?.[0].metaBoost).toHaveProperty(
          "node",
          "http://localhost:8080/boost"
        );
      });

      it("omits metaBoost when type is missing", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:metaBoost schema="boostbox">http://localhost:8080/boost</podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        invariant(result.values?.[0]);

        expect(result.values?.[0]).toHaveProperty("type", "lightning");
        expect(result.values?.[0]).toHaveProperty("recipients");
        expect(result.values?.[0].metaBoost).toBeUndefined();
      });

      it("omits metaBoost when schema is missing", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:metaBoost type="lightning">http://localhost:8080/boost</podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        invariant(result.values?.[0]);

        expect(result.values?.[0].metaBoost).toBeUndefined();
      });

      it("omits metaBoost when node text is empty", () => {
        const xml = helpers.spliceFeed(
          feed,
          `<podcast:value type="lightning" method="keysend" suggested="0.00000015000">
        <podcast:metaBoost type="lightning" schema="boostbox">   </podcast:metaBoost>
        <podcast:valueRecipient
            name="Alice (Podcaster)"
            type="node"
            address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
            split="100"
        />
      </podcast:value>
      `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);
        invariant(result.values?.[0]);

        expect(result.values?.[0].metaBoost).toBeUndefined();
      });
    });
  });

  describe("podcast:medium", () => {
    const supportedName = "medium";
    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);
      invariant(result);

      expect(result).not.toHaveProperty("medium");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("extracts node text", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium>podcast</podcast:medium>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("medium", Phase4Medium.Podcast);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("extracts the first populated node", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium></podcast:medium>
        <podcast:medium>audiobook</podcast:medium>
        <podcast:medium>podcast</podcast:medium>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("medium", Phase4Medium.Audiobook);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("ignores unknown types", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:medium>asfd</podcast:medium>
        <podcast:medium>audiobook</podcast:medium>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("medium", Phase4Medium.Audiobook);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("podcast:images", () => {
    const supportedName = "images";

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);
      invariant(result);

      expect(result).not.toHaveProperty("podcastImages");

      result.items.forEach((item) => {
        expect(item).not.toHaveProperty("podcastImages");
      });
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    describe("feed", () => {
      it("extracts the sample values", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:images
            srcset="https://example.com/images/ep1/pci_avatar-massive.jpg 1500w,
              https://example.com/images/ep1/pci_avatar-middle.jpg 600w,
              https://example.com/images/ep1/pci_avatar-small.jpg 300w,
              https://example.com/images/ep1/pci_avatar-tiny.jpg 150w"
          />
          `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result.podcastImages).toHaveLength(4);

        expect(result.podcastImages?.[0]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-massive.jpg 1500w"
        );
        expect(result.podcastImages?.[0].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-massive.jpg"
        );
        expect(result.podcastImages?.[0].parsed).toHaveProperty("width", 1500);
        expect(result.podcastImages?.[0].parsed).not.toHaveProperty("density");

        expect(result.podcastImages?.[1]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-middle.jpg 600w"
        );
        expect(result.podcastImages?.[1].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-middle.jpg"
        );
        expect(result.podcastImages?.[1].parsed).toHaveProperty("width", 600);
        expect(result.podcastImages?.[1].parsed).not.toHaveProperty("density");

        expect(result.podcastImages?.[2]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-small.jpg 300w"
        );
        expect(result.podcastImages?.[2].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-small.jpg"
        );
        expect(result.podcastImages?.[2].parsed).toHaveProperty("width", 300);
        expect(result.podcastImages?.[2].parsed).not.toHaveProperty("density");

        expect(result.podcastImages?.[3]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-tiny.jpg 150w"
        );
        expect(result.podcastImages?.[3].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-tiny.jpg"
        );
        expect(result.podcastImages?.[3].parsed).toHaveProperty("width", 150);
        expect(result.podcastImages?.[3].parsed).not.toHaveProperty("density");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("extracts the example density values", () => {
        const xml = helpers.spliceFeed(
          feed,
          `
          <podcast:images
            srcset="elva-fairy-320w.jpg,
              elva-fairy-480w.jpg 1.5x,
              elva-fairy-640w.jpg 2x"
          />
          `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result.podcastImages).toHaveLength(3);

        expect(result.podcastImages?.[0]).toHaveProperty("raw", "elva-fairy-320w.jpg");
        expect(result.podcastImages?.[0].parsed).toHaveProperty("url", "elva-fairy-320w.jpg");
        expect(result.podcastImages?.[0].parsed).not.toHaveProperty("width");
        expect(result.podcastImages?.[0].parsed).not.toHaveProperty("density");

        expect(result.podcastImages?.[1]).toHaveProperty("raw", "elva-fairy-480w.jpg 1.5x");
        expect(result.podcastImages?.[1].parsed).toHaveProperty("url", "elva-fairy-480w.jpg");
        expect(result.podcastImages?.[1].parsed).not.toHaveProperty("width");
        expect(result.podcastImages?.[1].parsed).toHaveProperty("density", 1.5);

        expect(result.podcastImages?.[2]).toHaveProperty("raw", "elva-fairy-640w.jpg 2x");
        expect(result.podcastImages?.[2].parsed).toHaveProperty("url", "elva-fairy-640w.jpg");
        expect(result.podcastImages?.[2].parsed).not.toHaveProperty("width");
        expect(result.podcastImages?.[2].parsed).toHaveProperty("density", 2);

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });
    });

    describe("item", () => {
      it("extracts the sample values", () => {
        const xml = helpers.spliceLastItem(
          feed,
          `
          <podcast:images
            srcset="https://example.com/images/ep1/pci_avatar-massive.jpg 1500w,
              https://example.com/images/ep1/pci_avatar-middle.jpg 600w,
              https://example.com/images/ep1/pci_avatar-small.jpg 300w,
              https://example.com/images/ep1/pci_avatar-tiny.jpg 150w"
          />
          `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result).not.toHaveProperty("podcastImages");
        expect(result.items[2].podcastImages).toHaveLength(4);

        expect(result.items[2].podcastImages?.[0]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-massive.jpg 1500w"
        );
        expect(result.items[2].podcastImages?.[0].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-massive.jpg"
        );
        expect(result.items[2].podcastImages?.[0].parsed).toHaveProperty("width", 1500);
        expect(result.items[2].podcastImages?.[0].parsed).not.toHaveProperty("density");

        expect(result.items[2].podcastImages?.[1]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-middle.jpg 600w"
        );
        expect(result.items[2].podcastImages?.[1].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-middle.jpg"
        );
        expect(result.items[2].podcastImages?.[1].parsed).toHaveProperty("width", 600);
        expect(result.items[2].podcastImages?.[1].parsed).not.toHaveProperty("density");

        expect(result.items[2].podcastImages?.[2]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-small.jpg 300w"
        );
        expect(result.items[2].podcastImages?.[2].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-small.jpg"
        );
        expect(result.items[2].podcastImages?.[2].parsed).toHaveProperty("width", 300);
        expect(result.items[2].podcastImages?.[2].parsed).not.toHaveProperty("density");

        expect(result.items[2].podcastImages?.[3]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-tiny.jpg 150w"
        );
        expect(result.items[2].podcastImages?.[3].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-tiny.jpg"
        );
        expect(result.items[2].podcastImages?.[3].parsed).toHaveProperty("width", 150);
        expect(result.items[2].podcastImages?.[3].parsed).not.toHaveProperty("density");

        expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
      });

      it("ignores malformed input", () => {
        const xml = helpers.spliceLastItem(
          feed,
          `
            <podcast:images
              srcset="https://example.com/images/ep1/pci_avatar-massive.jpg 1500q,"
            />
            `
        );
        const result = helpers.parseValidFeed(xml);
        invariant(result);

        expect(result).not.toHaveProperty("podcastImages");
        expect(result.items[2].podcastImages).toHaveLength(1);

        expect(result.items[2].podcastImages?.[0]).toHaveProperty(
          "raw",
          "https://example.com/images/ep1/pci_avatar-massive.jpg 1500q"
        );
        expect(result.items[2].podcastImages?.[0].parsed).toHaveProperty(
          "url",
          "https://example.com/images/ep1/pci_avatar-massive.jpg"
        );
        expect(result.items[2].podcastImages?.[0].parsed).not.toHaveProperty("width");
        expect(result.items[2].podcastImages?.[0].parsed).not.toHaveProperty("density");
      });
    });
  });

  describe("podcast:liveItem", () => {
    const supportedName = "liveItem";

    it("correctly identifies a basic feed", () => {
      const result = helpers.parseValidFeed(feed);
      invariant(result);

      expect(result).not.toHaveProperty("podcastLiveItems");
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });

    it("supports multiple liveItem", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem status="LIVE" start="2021-09-26T07:30:00.000-0600"
        end="2021-09-26T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        <podcast:liveItem status="pending" start="2021-09-27T07:30:00.000-0600"
        end="2021-09-27T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        <podcast:liveItem status="ENded" start="2021-09-28T07:30:00.000-0600"
        end="2021-09-28T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("podcastLiveItems");
      expect(result.podcastLiveItems).toHaveLength(3);

      expect(result.podcastLiveItems?.[0]).toHaveProperty("status", Phase4LiveStatus.Live);
      expect(result.podcastLiveItems?.[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems?.[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );

      expect(result.podcastLiveItems?.[1]).toHaveProperty("status", Phase4LiveStatus.Pending);
      expect(result.podcastLiveItems?.[1]).toHaveProperty(
        "start",
        new Date("2021-09-27T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems?.[1]).toHaveProperty(
        "end",
        new Date("2021-09-27T08:30:00.000-0600")
      );

      expect(result.podcastLiveItems?.[2]).toHaveProperty("status", Phase4LiveStatus.Ended);
      expect(result.podcastLiveItems?.[2]).toHaveProperty(
        "start",
        new Date("2021-09-28T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems?.[2]).toHaveProperty(
        "end",
        new Date("2021-09-28T08:30:00.000-0600")
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("supports a basic liveItem", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem status="livE" start="2021-09-26T07:30:00.000-0600" end="2021-09-26T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("podcastLiveItems");

      expect(result.podcastLiveItems).toHaveLength(1);
      invariant(result.podcastLiveItems);

      expect(result.podcastLiveItems[0]).not.toHaveProperty("item");
      expect(result.podcastLiveItems[0]).toHaveProperty("status", Phase4LiveStatus.Live);
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("supports a liveItem with value tags", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem status="livE" start="2021-09-26T07:30:00.000-0600" end="2021-09-26T08:30:00.000-0600">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
          <podcast:value type="lightning" method="keysend" suggested="0.00000015000">
            <podcast:valueRecipient
                name="Alice (Podcaster)"
                type="node"
                address="02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52"
                split="40"
            />
            <podcast:valueRecipient
                name="Bob (Podcaster)"
                type="node"
                address="032f4ffbbafffbe51726ad3c164a3d0d37ec27bc67b29a159b0f49ae8ac21b8508"
                split="40"
            />
            <podcast:valueRecipient
                name="Carol (Producer)"
                type="node"
                address="02dd306e68c46681aa21d88a436fb35355a8579dd30201581cefa17cb179fc4c15"
                split="15"
            />
            <podcast:valueRecipient
                name="Hosting Provider"
                type="node"
                address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a"
                split="5"
                fee="true"
            />
        </podcast:value>
        </podcast:liveItem>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("podcastLiveItems");

      expect(result.podcastLiveItems).toHaveLength(1);
      invariant(result.podcastLiveItems);

      const [lit] = result.podcastLiveItems;
      expect(lit).not.toHaveProperty("item");
      expect(lit).toHaveProperty("status", Phase4LiveStatus.Live);
      expect(lit).toHaveProperty("start", new Date("2021-09-26T07:30:00.000-0600"));
      expect(lit).toHaveProperty("end", new Date("2021-09-26T08:30:00.000-0600"));

      expect(lit.values).toHaveLength(1);
      expect(lit.values?.[0]).toHaveProperty("type", "lightning");
      expect(lit.values?.[0]).toHaveProperty("method", "keysend");
      expect(lit.values?.[0]).toHaveProperty("suggested", 0.00000015);

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    // skipping this as it feel like its been superseded in spirit by the child item tag
    // see https://github.com/Podcastindex-org/podcast-namespace/discussions/502
    it("supports chat liveItem", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem status="livE" start="2021-09-26T07:30:00.000-0600" end="2021-09-26T08:30:00.000-0600" chat="https://talky.io">
          <title>Podcasting 2.0 Live Stream</title>
          <guid>e32b4890-983b-4ce5-8b46-f2d6bc1d8819</guid>
          <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
          <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        `
      );
      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("podcastLiveItems");

      expect(result.podcastLiveItems).toHaveLength(1);
      invariant(result.podcastLiveItems);

      expect(result.podcastLiveItems[0]).toHaveProperty("chat");
      expect(result.podcastLiveItems[0].chat).toHaveProperty("phase", "4");
      expect(result.podcastLiveItems[0].chat).toHaveProperty("url", "https://talky.io");

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("support a sub-set of nested item tags", () => {
      const xml = helpers.spliceFeed(
        feed,
        `
        <podcast:liveItem
          status="liVe"
          start="2021-09-26T07:30:00.000-0600"
          end="2021-09-26T08:30:00.000-0600"
        >
            <title>Podcasting 2.0 Live Show</title>
            <description>A look into the future of podcasting and how we get to Podcasting 2.0!</description>
            <link>https://example.com/podcast/live</link>
            <guid isPermaLink="true">https://example.com/live</guid>
            <author>John Doe (john@example.com)</author>
            <podcast:images srcset="https://example.com/images/ep3/pci_avatar-massive.jpg 1500w,
                https://example.com/images/ep3/pci_avatar-middle.jpg 600w,
                https://example.com/images/ep3/pci_avatar-small.jpg 300w,
                https://example.com/images/ep3/pci_avatar-tiny.jpg 150w"
            />
            <enclosure url="https://example.com/pc20/livestream?format=.mp3" type="audio/mpeg" length="312" />
            <podcast:person href="https://www.podchaser.com/creators/adam-curry-107ZzmWE5f" img="https://example.com/images/adamcurry.jpg">Adam Curry</podcast:person>
            <podcast:person role="guest" href="https://github.com/daveajones/" img="https://example.com/images/davejones.jpg">Dave Jones</podcast:person>
            <podcast:person group="visuals" role="cover art designer" href="https://example.com/artist/beckysmith">Becky Smith</podcast:person>
            <podcast:alternateEnclosure type="audio/mpeg" length="312">
                <podcast:source uri="https://example.com/pc20/livestream" />
            </podcast:alternateEnclosure>
            <podcast:contentLink href="https://youtube.com/pc20/livestream">YouTube!</podcast:contentLink>
            <podcast:contentLink href="https://twitch.com/pc20/livestream">Twitch!</podcast:contentLink>
            <podcast:contentLink href="https://example.com/html/livestream">Listen Live!</podcast:contentLink>
        </podcast:liveItem>
        `
      );

      const result = helpers.parseValidFeed(xml);
      invariant(result);

      expect(result).toHaveProperty("podcastLiveItems");
      invariant(result);

      expect(result.podcastLiveItems).toHaveLength(1);
      invariant(result.podcastLiveItems);

      expect(result.podcastLiveItems[0]).toHaveProperty("status", Phase4LiveStatus.Live);
      expect(result.podcastLiveItems[0]).toHaveProperty("status", "live");
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "start",
        new Date("2021-09-26T07:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "end",
        new Date("2021-09-26T08:30:00.000-0600")
      );
      expect(result.podcastLiveItems[0]).toHaveProperty("title", "Podcasting 2.0 Live Show");
      expect(result.podcastLiveItems[0]).toHaveProperty(
        "description",
        "A look into the future of podcasting and how we get to Podcasting 2.0!"
      );
      expect(result.podcastLiveItems[0]).toHaveProperty("guid", "https://example.com/live");
      expect(result.podcastLiveItems[0]).toHaveProperty("author", "John Doe (john@example.com)");

      expect(result.podcastLiveItems[0].podcastImages).toHaveLength(4);
      expect(result.podcastLiveItems[0].podcastPeople).toHaveLength(3);
      expect(result.podcastLiveItems[0].alternativeEnclosures).toHaveLength(1);
      expect(result.podcastLiveItems[0].contentLinks).toHaveLength(3);
      expect(result.podcastLiveItems[0].contentLinks).toHaveLength(3);

      expect(result.podcastLiveItems[0].contentLinks[0]).toHaveProperty(
        "url",
        "https://youtube.com/pc20/livestream"
      );
      expect(result.podcastLiveItems[0].contentLinks[0]).toHaveProperty("title", "YouTube!");

      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });
  });

  describe("contentLink", () => {
    const supportedName = "contentLink";

    it("parses single podcast:contentLink on item", () => {
      const contentLinkBlock = `
      <podcast:contentLink href="https://www.youtube.com/watch?v=example">Watch on YouTube</podcast:contentLink>`;
      const result = helpers.parseValidFeed(helpers.spliceFirstItem(feed, contentLinkBlock));
      invariant(result.items);
      const [firstItem] = result.items;
      expect(firstItem.contentLinks).toHaveLength(1);
      expect(firstItem.contentLinks?.[0]).toHaveProperty(
        "url",
        "https://www.youtube.com/watch?v=example"
      );
      expect(firstItem.contentLinks?.[0]).toHaveProperty("title", "Watch on YouTube");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("parses multiple podcast:contentLink on item", () => {
      const contentLinkBlock = `
      <podcast:contentLink href="https://www.youtube.com/watch?v=one">Watch on YouTube</podcast:contentLink>
      <podcast:contentLink href="https://open.spotify.com/episode/two">Listen on Spotify</podcast:contentLink>`;
      const result = helpers.parseValidFeed(helpers.spliceFirstItem(feed, contentLinkBlock));
      invariant(result.items);
      const [firstItem] = result.items;
      expect(firstItem.contentLinks).toHaveLength(2);
      expect(firstItem.contentLinks?.[0]).toHaveProperty(
        "url",
        "https://www.youtube.com/watch?v=one"
      );
      expect(firstItem.contentLinks?.[0]).toHaveProperty("title", "Watch on YouTube");
      expect(firstItem.contentLinks?.[1]).toHaveProperty(
        "url",
        "https://open.spotify.com/episode/two"
      );
      expect(firstItem.contentLinks?.[1]).toHaveProperty("title", "Listen on Spotify");
      expect(helpers.getPhaseSupport(result, phase)).toContain(supportedName);
    });

    it("does not add contentLinks when item has no podcast:contentLink", () => {
      const result = helpers.parseValidFeed(feed);
      invariant(result.items);
      const [firstItem] = result.items;
      expect(firstItem.contentLinks).toBeUndefined();
      expect(helpers.getPhaseSupport(result, phase)).not.toContain(supportedName);
    });
  });
});
