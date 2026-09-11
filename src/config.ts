import dotenv from "dotenv";

dotenv.config();

const trueValues = ["t", "y", "1", "true", "yes"];
// const falseValues = ["f", "n", "0", "false", "no"];

function getBooleanValue(val: string | undefined): boolean {
  if (typeof val === "string") {
    return trueValues.includes(val.toLowerCase());
  }
  return false;
}

const isLocalDev = getBooleanValue(process.env.IS_LOCAL_DEV);
const environment = process.env.NODE_ENV ?? "development";
const defaultLevel = new Map([
  ["development", "info"],
  ["production", "warn"],
  ["test", "silent"],
]);

const localDevelopmentLogFallback = isLocalDev ? defaultLevel.get(environment) : undefined;

/** Default max UTF-8 byte length for RSS/XML passed to parseFeed (20 MiB). */
export const DEFAULT_MAX_FEED_BODY_BYTES = 20 * 1024 * 1024;

const PARSER_MAX_FEED_BODY_BYTES_MIN = 1000;
const PARSER_MAX_FEED_BODY_BYTES_MAX = 50_000_000;

function parseParserMaxFeedBodyBytes(): number | undefined {
  const raw = process.env.PARSER_MAX_FEED_BODY_BYTES;
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  const n = Number.parseInt(raw.trim(), 10);
  if (
    !Number.isFinite(n) ||
    n < PARSER_MAX_FEED_BODY_BYTES_MIN ||
    n > PARSER_MAX_FEED_BODY_BYTES_MAX
  ) {
    throw new Error(
      `PARSER_MAX_FEED_BODY_BYTES must be an integer between ${PARSER_MAX_FEED_BODY_BYTES_MIN} and ${PARSER_MAX_FEED_BODY_BYTES_MAX} when set`
    );
  }
  return n;
}

export default {
  logLevel: process.env.PARTYTIME_LOG ?? localDevelopmentLogFallback ?? "warn",
  environment,
  parserMaxFeedBodyBytes: parseParserMaxFeedBodyBytes(),
};
