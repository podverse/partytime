import { XMLParser, XMLValidator } from "fast-xml-parser";
import he from "he";

import { XmlNode } from "./types";

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
  tagValueProcessor: (_tagName: string, tagValue: string) => he.decode(tagValue),
  attributeValueProcessor: (_tagName: string, tagValue: string) => he.decode(tagValue),
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
