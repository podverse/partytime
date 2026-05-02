/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import config, { DEFAULT_MAX_FEED_BODY_BYTES } from "../config";
import { logger } from "../logger";

import { ParserOptions, unifiedParser } from "./unified";
import { parse, validate } from "./xml-parser";
import { FeedObject, FeedType } from "./types";

const OPTIONS_MAX_FEED_BODY_BYTES_MIN = 1000;
const OPTIONS_MAX_FEED_BODY_BYTES_MAX = 50_000_000;

function resolveMaxFeedBodyBytes(options?: ParserOptions): number {
  const fromOptions = options?.maxFeedBodyBytes;
  if (fromOptions !== undefined) {
    if (
      !Number.isFinite(fromOptions) ||
      fromOptions < OPTIONS_MAX_FEED_BODY_BYTES_MIN ||
      fromOptions > OPTIONS_MAX_FEED_BODY_BYTES_MAX
    ) {
      logger.warn(
        `maxFeedBodyBytes must be between ${OPTIONS_MAX_FEED_BODY_BYTES_MIN} and ${OPTIONS_MAX_FEED_BODY_BYTES_MAX}; using default ${DEFAULT_MAX_FEED_BODY_BYTES}`
      );
      return config.parserMaxFeedBodyBytes ?? DEFAULT_MAX_FEED_BODY_BYTES;
    }
    return fromOptions;
  }
  return config.parserMaxFeedBodyBytes ?? DEFAULT_MAX_FEED_BODY_BYTES;
}

export function parseFeed(xml: string, options?: ParserOptions): FeedObject | null {
  const trimmed = xml.trim();
  const limit = resolveMaxFeedBodyBytes(options);
  const byteLength = Buffer.byteLength(trimmed, "utf8");
  if (byteLength > limit) {
    logger.warn(
      `Feed XML exceeds max size (${byteLength} UTF-8 bytes > ${limit} bytes); skipping parse`
    );
    return null;
  }

  const parsedContent = validate(trimmed);
  if (parsedContent === true) {
    return handleValidFeed(trimmed, options);
  }
  return handleInvalidFeed(trimmed);
}

function handleValidFeed(xml: string, options?: ParserOptions): FeedObject | null {
  const theFeed = parse(xml);
  let feedObj: FeedObject | null;
  if (typeof theFeed.rss === "object") {
    feedObj = unifiedParser(theFeed, FeedType.RSS, options);
  } else if (typeof theFeed.feed === "object") {
    feedObj = unifiedParser(theFeed, FeedType.ATOM, options);
  } else {
    // Unsupported
    return null;
  }

  if (!feedObj) {
    logger.error("Parsing failed...");
    return null;
  }

  return feedObj;
}

function handleInvalidFeed(xml: string) {
  logger.warn("invalid feed");
  logger.warn(xml);
  return null;
}
