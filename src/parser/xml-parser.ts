import { XMLParser, XMLValidator } from "fast-xml-parser";
import he from "he";

import { XmlNode } from "./types";

// Allow feeds with many XML entity expansions (e.g. 1064) while still guarding against
// entity expansion (XML bomb) attacks. Default in fast-xml-parser is 1000.
const ENTITY_EXPANSION_LIMIT = 50000;

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
    maxEntityCount: ENTITY_EXPANSION_LIMIT,
    maxTotalExpansions: ENTITY_EXPANSION_LIMIT,
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
