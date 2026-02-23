/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import mergeWith from "ramda/src/mergeWith";
import concat from "ramda/src/concat";
import mergeDeepRight from "ramda/src/mergeDeepRight";

import { logger } from "../logger";

import { ensureArray } from "./shared";
import type { BasicFeed, Episode, FeedObject, FeedType, PhaseUpdate, XmlNode } from "./types";
import { updateFeed, updateItem } from "./phase";
import { handleItem, isValidItem } from "./item";
import { handleFeed } from "./feed";
import { Phase2SeasonNumber } from "./phase/phase-2";

function asFeedObject(f: BasicFeed): FeedObject {
  return f as FeedObject;
}

export type ParserOptions = {
  allowMissingGuid?: boolean;
};

function handlePodcastSeasons(feedObj: BasicFeed) {
  const tempSeasons = [] as Array<Phase2SeasonNumber>;
  // eslint-disable-next-line no-restricted-syntax
  for (const { podcastSeason } of feedObj.items) {
    if (podcastSeason) {
      const existingValue = tempSeasons.find((x) => x.number === podcastSeason.number);
      if (existingValue && !existingValue.name && podcastSeason.name) {
        existingValue.name = podcastSeason.name;
      } else if (!existingValue) {
        tempSeasons.push(podcastSeason);
      }
    }
  }
  if (tempSeasons.length > 0) {
    return {
      podcastSeasons: tempSeasons
        .sort((a, b) => a.number - b.number)
        .reduce((agg, curr) => ({ ...agg, [curr.number]: curr }), {}),
    };
  }
  return undefined;
}

export function unifiedParser(theFeed: XmlNode, type: FeedType, options?: ParserOptions) {
  const epochDate = new Date(0);
  if (typeof theFeed.rss.channel === "undefined") {
    logger.warn("Provided XML has no channel node, unparsable");
    return null;
  }

  let feedObj = handleFeed(theFeed.rss.channel, type);

  let phaseSupport: PhaseUpdate = {};

  // Feed Phase Support
  const feedResult = updateFeed(theFeed);
  feedObj = mergeWith(concat, feedObj, feedResult.feedUpdate);
  phaseSupport = mergeDeepRight(phaseSupport, feedResult.phaseUpdate);

  const feed = asFeedObject(feedObj);

  //------------------------------------------------------------------------
  // Are there even any items to get
  if (typeof theFeed.rss.channel.item !== "undefined") {
    // Items
    feedObj.items = ensureArray(theFeed.rss.channel.item)
      .map((item: XmlNode): Episode | undefined => {
        if (!isValidItem(item, options)) {
          return undefined;
        }

        let newFeedItem: Episode = handleItem(item, feedObj);

        // Item Phase Support
        const itemResult = updateItem(item, theFeed);
        newFeedItem = mergeWith(concat, newFeedItem, itemResult.itemUpdate);
        phaseSupport = mergeDeepRight(phaseSupport, itemResult.phaseUpdate);

        // Value Block Fallback: item has no values, use channel values
        if (!newFeedItem.values?.length && feed.values?.length) {
          newFeedItem.values = feed.values;
        }

        return newFeedItem;
      })
      .filter((x: Episode | undefined) => x) as Episode[];

    feedObj.newestItemPubDate = feedObj.items.reduce(
      (oldestDate, currEpisode) =>
        currEpisode.pubDate && currEpisode.pubDate > oldestDate ? currEpisode.pubDate : oldestDate,
      epochDate
    );

    feedObj.oldestItemPubDate = feedObj.items.reduce(
      (newestDate, currEpisode) =>
        currEpisode.pubDate && currEpisode.pubDate < newestDate ? currEpisode.pubDate : newestDate,
      feedObj.newestItemPubDate
    );
  } else {
    logger.warn("Provided feed has no items to parse.");
  }

  // Value Block Fallback: liveItem has no values, use channel values
  if (feed.podcastLiveItems?.length && feed.values?.length) {
    feed.podcastLiveItems.forEach((_, i) => {
      const liveItem = feed.podcastLiveItems?.[i];
      if (liveItem && !liveItem.values?.length) {
        liveItem.values = feed.values;
      }
    });
  }

  if (feedObj.newestItemPubDate && !feedObj.pubDate) {
    feedObj.pubDate = feedObj.newestItemPubDate;
  }

  if (feedObj.newestItemPubDate && feedObj.pubDate) {
    feedObj.lastPubDate =
      feedObj.newestItemPubDate > feedObj.pubDate ? feedObj.newestItemPubDate : feedObj.pubDate;
  } else if (feedObj.pubDate) {
    feedObj.lastPubDate = feedObj.pubDate;
  }

  if (Object.keys(phaseSupport).length > 0) {
    feedObj.pc20support = Object.entries(phaseSupport).reduce(
      (phases, [phase, kv]) => ({ ...phases, [phase]: Object.keys(kv) }),
      {}
    );
  }

  return {
    podcastBlocked: "no",
    ...feedObj,
    ...handlePodcastSeasons(feedObj),
  } as FeedObject;
}
