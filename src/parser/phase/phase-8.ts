import { ensureArray, getAttribute, normalizeHttpUrl } from "../shared";
import type { XmlNode } from "../types";

export type Phase8Follow = {
  url: string;
};

function getFollowUrl(node: XmlNode): string | null {
  const url = getAttribute(node, "url");
  return url ? normalizeHttpUrl(url, true) : null;
}

export const podcastFollow = {
  phase: 8,
  name: "follow",
  tag: "podcast:follow",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode | undefined =>
    ensureArray(node).find((n) => getFollowUrl(n)),
  supportCheck: (node: XmlNode): boolean => Boolean(getFollowUrl(node)),
  fn(node: XmlNode): { podcastFollow: Phase8Follow } {
    const url = getFollowUrl(node);

    if (!url) {
      throw new Error("Unable to extract phase 8 podcastFollow; supportCheck needs to be updated");
    }

    return {
      podcastFollow: {
        url,
      },
    };
  },
};
