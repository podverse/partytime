/** Default max UTF-8 byte length for RSS/XML passed to parseFeed (20 MiB). */
export const DEFAULT_MAX_FEED_BODY_BYTES = 20 * 1024 * 1024;

let configuredMaxFeedBodyBytes: number | undefined;

/**
 * Root entry point sets this value from PARSER_MAX_FEED_BODY_BYTES.
 * Core callers leave it unset.
 */
export function setConfiguredMaxFeedBodyBytes(value: number | undefined): void {
  configuredMaxFeedBodyBytes = value;
}

export function getConfiguredMaxFeedBodyBytes(): number | undefined {
  return configuredMaxFeedBodyBytes;
}
