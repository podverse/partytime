import {
  ensureArray,
  extractOptionalFloatAttribute,
  extractOptionalIntegerAttribute,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
  getText,
  pubDateToDate,
} from "../shared";
import type { XmlNode } from "../types";

import { XmlNodeSource } from "./types";

export type PhasePendingPodcastId = {
  platform: string;
  url: string;
  id?: string;
};
export const id = {
  phase: Infinity,
  tag: "podcast:id",
  name: "id",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[]): boolean =>
    node.some((n) => Boolean(getAttribute(n, "platform")) && Boolean(getAttribute(n, "url"))),
  fn(node: XmlNode[]): { podcastId: PhasePendingPodcastId[] } {
    return {
      podcastId: node
        .map((n) => ({
          platform: getAttribute(n, "platform"),
          url: getAttribute(n, "url"),
          ...extractOptionalStringAttribute(n, "id"),
        }))
        .filter((x) => Boolean(x.platform) && Boolean(x.url)) as PhasePendingPodcastId[],
    };
  },
};

export type PhasePendingSocial = {
  platform: string;
  url: string;
  id?: string;
  name?: string;
  priority?: number;
  signUp?: SocialSignUp[];
};
type SocialSignUp = {
  homeUrl: string;
  signUpUrl: string;
  priority?: number;
};
export const social = {
  phase: Infinity,
  tag: "podcast:social",
  name: "social",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Feed &&
    node.some(
      (n) =>
        Boolean(getAttribute(n, "platform")) &&
        (Boolean(getAttribute(n, "url")) || Boolean(getAttribute(n, "podcastAccountUrl")))
    ),
  fn(node: XmlNode[]): { podcastSocial: PhasePendingSocial[] } {
    const isValidFeedNode = (n: XmlNode): boolean =>
      Boolean(getAttribute(n, "platform")) &&
      (Boolean(getAttribute(n, "url")) || Boolean(getAttribute(n, "podcastAccountUrl")));

    return {
      podcastSocial: node.reduce<PhasePendingSocial[]>((acc, n) => {
        const url = getAttribute(n, "url") || getAttribute(n, "podcastAccountUrl");
        if (isValidFeedNode(n) && url) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const signUps = ensureArray(n["podcast:socialSignUp"]);
          const name = getText(n);

          const signUp =
            signUps.length > 0
              ? {
                  signUp: signUps.reduce<SocialSignUp[]>((signUpAcc, signUpNode: XmlNode) => {
                    if (
                      getAttribute(signUpNode, "signUpUrl") &&
                      getAttribute(signUpNode, "homeUrl")
                    ) {
                      return [
                        ...signUpAcc,
                        {
                          signUpUrl: getKnownAttribute(signUpNode, "signUpUrl"),
                          homeUrl: getKnownAttribute(signUpNode, "homeUrl"),
                          ...extractOptionalFloatAttribute(signUpNode, "priority"),
                        },
                      ];
                    }
                    return signUpAcc;
                  }, []),
                }
              : undefined;

          return [
            ...acc,
            {
              url,
              platform: getKnownAttribute(n, "platform"),
              ...(name ? { name } : undefined),
              ...extractOptionalStringAttribute(n, "podcastAccountId", "id"),
              ...extractOptionalFloatAttribute(n, "priority"),
              ...signUp,
            },
          ];
        }

        return acc;
      }, []),
    };
  },
};

export type PhasePendingSocialInteract = {
  platform: string;
  id: string;
  url: string;
  pubDate?: Date;
  priority?: number;
};
export const socialInteraction = {
  phase: Infinity,
  name: "social",
  tag: "podcast:socialInteract",
  nodeTransform: ensureArray,
  supportCheck: (node: XmlNode[], type: XmlNodeSource): boolean =>
    type === XmlNodeSource.Item &&
    node.some(
      (n) =>
        Boolean(getAttribute(n, "platform")) &&
        Boolean(getAttribute(n, "podcastAccountId") && Boolean(getText(n)))
    ),
  fn(node: XmlNode[]): { podcastSocialInteraction: PhasePendingSocialInteract[] } {
    const isValidItemNode = (n: XmlNode): boolean =>
      Boolean(getAttribute(n, "platform")) &&
      Boolean(getAttribute(n, "podcastAccountId") && Boolean(getText(n)));

    return {
      podcastSocialInteraction: node.reduce<PhasePendingSocialInteract[]>((acc, n) => {
        if (isValidItemNode(n)) {
          const pubDateText = getAttribute(n, "pubDate");
          const pubDateAsDate = pubDateText && pubDateToDate(pubDateText);
          return [
            ...acc,
            {
              platform: getKnownAttribute(n, "platform"),
              id: getKnownAttribute(n, "podcastAccountId"),
              url: getText(n),
              ...extractOptionalFloatAttribute(n, "priority"),
              ...(pubDateAsDate ? { pubDate: pubDateAsDate } : undefined),
            },
          ];
        }

        return acc;
      }, []),
    };
  },
};

export type PhasePendingPodcastRecommendation = {
  url: string;
  type: string;
  language?: string;
  text?: string;
};
export const podcastRecommendations = {
  phase: Infinity,
  name: "recommendations",
  tag: "podcast:recommendations",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => getAttribute(n, "url") && getAttribute(n, "type")),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastRecommendations: PhasePendingPodcastRecommendation[] } {
    return {
      podcastRecommendations: node.map((n) => ({
        url: getKnownAttribute(n, "url"),
        type: getKnownAttribute(n, "type"),
        ...extractOptionalStringAttribute(n, "language"),
        ...(getText(n) ? { text: getText(n) } : undefined),
      })),
    };
  },
};

export type PhasePendingGateway = {
  order?: number;
  message: string;
};
export const podcastGateway = {
  phase: Infinity,
  name: "gateway",
  tag: "podcast:gateway",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getText(n)),
  supportCheck: (node: XmlNode): boolean => Boolean(getText(node)),
  fn(node: XmlNode): { podcastGateway: PhasePendingGateway } {
    return {
      podcastGateway: {
        message: getText(node),
        ...extractOptionalIntegerAttribute(node, "order"),
      },
    };
  },
};
