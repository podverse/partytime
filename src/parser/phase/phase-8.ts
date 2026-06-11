import {
  ensureArray,
  extractOptionalIntegerAttribute,
  extractOptionalStringAttribute,
  getAttribute,
  getKnownAttribute,
} from "../shared";
import type { XmlNode } from "../types";

import { addSubTag } from "./helpers";

export type Phase8PodcastImage = {
  href: string;
  alt?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  type?: string;
  purpose?: string;
};

function parseImage(node: XmlNode): Phase8PodcastImage {
  return {
    href: getKnownAttribute(node, "href"),
    ...extractOptionalStringAttribute(node, "alt"),
    ...extractOptionalStringAttribute(node, "aspect-ratio", "aspectRatio"),
    ...extractOptionalIntegerAttribute(node, "width"),
    ...extractOptionalIntegerAttribute(node, "height"),
    ...extractOptionalStringAttribute(node, "type"),
    ...extractOptionalStringAttribute(node, "purpose"),
  };
}

export const podcastImage = {
  phase: 8,
  name: "image",
  tag: "podcast:image",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) => getAttribute(n, "href")),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastImage: Phase8PodcastImage[] } {
    return {
      podcastImage: node.map(parseImage),
    };
  },
};

addSubTag("liveItem", podcastImage);
