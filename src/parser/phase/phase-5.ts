import {
  getAttribute,
  getText,
  ensureArray,
  pubDateToDate,
  extractOptionalFloatAttribute,
} from "../shared";
import type { FeedObject, XmlNode } from "../types";

import { XmlNodeSource } from "./types";

import type { FeedUpdate, ItemUpdate } from "./index";

function getSocialPlatform(n: XmlNode): string | null {
  return (getAttribute(n, "platform") || getAttribute(n, "protocol")) ?? null;
}

function getSocialAccount(n: XmlNode): string | null {
  return (getAttribute(n, "podcastAccountId") || getAttribute(n, "accountId")) ?? null;
}
function getSocialUrl(n: XmlNode): string | null {
  return (getAttribute(n, "uri") || getText(n)) ?? null;
}
function getSocialProfileUrl(n: XmlNode): string | null {
  return getAttribute(n, "accountUrl") ?? null;
}

export type Phase5SocialInteract = {
  /** slug of social protocol being used */
  platform: string;
  /** account id of posting party */
  id: string;
  /** uri of root post/comment */
  url: string;
  /** url to posting party's platform profile */
  profileUrl?: string;
  /** DEPRECATED */
  pubDate?: Date;
  /** the order of rendering */
  priority?: number;
};
function reduceSocialInteractNodes(node: XmlNode[]): Phase5SocialInteract[] {
  const isValidNode = (n: XmlNode): boolean =>
    Boolean(getSocialPlatform(n)) && Boolean(getSocialUrl(n));
  return node.reduce<Phase5SocialInteract[]>((acc, n) => {
    if (isValidNode(n)) {
      const profileUrl = getSocialProfileUrl(n);
      const pubDateText = getAttribute(n, "pubDate");
      const pubDateAsDate = pubDateText && pubDateToDate(pubDateText);
      return [
        ...acc,
        {
          platform: getSocialPlatform(n) ?? "",
          id: getSocialAccount(n) ?? "",
          url: getSocialUrl(n) ?? "",
          ...extractOptionalFloatAttribute(n, "priority"),
          ...(pubDateAsDate ? { pubDate: pubDateAsDate } : undefined),
          ...(profileUrl ? { profileUrl } : undefined),
        },
      ];
    }
    return acc;
  }, []);
}

/** FeedUpdate: parses channel-level podcast:socialInteract. */
export const socialInteractChannel: FeedUpdate = {
  phase: 5,
  name: "socialInteract",
  tag: "podcast:socialInteract",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Feed &&
    node.some((n) => Boolean(getSocialPlatform(n)) && Boolean(getSocialUrl(n))),
  fn(node: XmlNode, _feed: unknown, _type: XmlNodeSource): Partial<FeedObject> {
    return {
      channelPodcastSocialInteract: reduceSocialInteractNodes(ensureArray(node)),
    };
  },
};

export const socialInteraction: ItemUpdate = {
  phase: 5,
  name: "socialInteract",
  tag: "podcast:socialInteract",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Item &&
    node.some((n) => Boolean(getSocialPlatform(n)) && Boolean(getSocialUrl(n))),
  fn(node: XmlNode): { podcastSocialInteraction: Phase5SocialInteract[] } {
    return { podcastSocialInteraction: reduceSocialInteractNodes(ensureArray(node)) };
  },
};

export enum Phase5Blocked {
  /** Block everyone */
  Yes = "yes",
  /** Block no-one */
  No = "no",
  /** Block specific platforms */
  Partial = "partial",
}
export type Phase5BlockedPlatforms = Record<string, boolean>;
type BlockedReturnType = Required<Pick<FeedObject, "podcastBlocked" | "podcastBlockedPlatforms">>;

export const block: FeedUpdate = {
  tag: "podcast:block",
  name: "block",
  phase: 5,
  nodeTransform: (nodes: XmlNode | XmlNode[]) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(nodes).filter((x) => /(yes|no)/i.test(getText(x))),
  supportCheck: (node: XmlNode[]) => node.length > 0,
  fn(nodes: XmlNode[]): BlockedReturnType {
    const initialValue = {
      podcastBlocked: Phase5Blocked.No,
      podcastBlockedPlatforms: {},
    } as BlockedReturnType;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
    return nodes.reduce((agg: BlockedReturnType, node) => {
      const specifiedId = getAttribute(node, "id");
      if (specifiedId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...agg,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          podcastBlockedPlatforms: {
            ...agg.podcastBlockedPlatforms,
            [specifiedId]: /yes/i.test(getText(node)),
          },
        };
      }

      if (specifiedId === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...agg,
          podcastBlocked: /yes/i.test(getText(node)) ? Phase5Blocked.Yes : Phase5Blocked.No,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return agg;
    }, initialValue);
  },
};

export function isSafeToIngest(feed: FeedObject, serviceName: string): boolean {
  const explicitValue = feed.podcastBlockedPlatforms?.[serviceName];

  return typeof explicitValue === "boolean"
    ? !explicitValue
    : feed.podcastBlocked === Phase5Blocked.No;
}

export function isServiceBlocked(feed: FeedObject, serviceName: string): boolean {
  const explicitValue = feed.podcastBlockedPlatforms?.[serviceName];

  return typeof explicitValue === "boolean"
    ? explicitValue
    : feed.podcastBlocked === Phase5Blocked.Yes;
}
