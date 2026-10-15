import { XMLParser, XMLValidator } from "fast-xml-parser";
import { decode } from "he";

import { XmlNode } from "./types";

// Titles are display text, so "007" or "1.10" must not be coerced to a number.
const STRING_ONLY_TAGS = new Set(["title", "itunes:title"]);

// fast-xml-parser skips number coercion when the processor returns null, and
// returns any value that differs from the input as-is.
function processTagValue(tagName: string, tagValue: string): string | null {
  const decoded = decode(tagValue);
  if (decoded === tagValue && STRING_ONLY_TAGS.has(tagName)) {
    return null;
  }
  return decoded;
}

// Predefined XML entities (&amp;, &lt;, numeric refs) are unlimited. Limits apply
// only to DOCTYPE-defined entities so large RSS catalogs with escaped HTML still
// parse, while entity-expansion bombs stay capped.
const parserOptions = {
  attributeNamePrefix: "@_",
  attributesGroupName: "attr",
  textNodeName: "#text",
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  tagValueProcessor: processTagValue,
  attributeValueProcessor: (_tagName: string, tagValue: string) => decode(tagValue),
  stopNodes: ["parse-me-as-string"],
  processEntities: {
    enabled: true,
    appliesTo: "external",
    maxEntityCount: 100,
    maxEntitySize: 10000,
    maxExpansionDepth: 10,
    maxTotalExpansions: 1000,
    maxExpandedLength: 100000,
  },
};

export function validate(xml: string): true | unknown {
  const validator = XMLValidator as unknown as { validate: (s: string) => true | unknown };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return validator.validate(xml.trim());
}

export function parse(xml: string): XmlNode {
  const ParserCtor = XMLParser as unknown as new (opts?: Record<string, unknown>) => {
    parse: (s: string) => XmlNode;
  };

  const xmlParser = new ParserCtor(parserOptions as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return xmlParser.parse(xml.trim());
}
