import fs from "fs";
import path from "path";
import yaml from "yaml";
import mustache from "mustache";

type Collection = {
  name: string;
  singular: string;
  plural: string;
  properties: AnyProperty[];
}

type AnyProperty = never
  | PlainTextProperty
  | NumberProperty
  | RelationProperty
  | SelectProperty
  | DateTimeProperty
  | BooleanProperty
  | EmailProperty
  | UrlProperty
  | RichTextProperty
  | JsonProperty
;

type Property = {
  name: string;
}

type PlainTextProperty = Property & {
  type: "plainText";
}

type NumberProperty = Property & {
  type: "number";
}

type RelationProperty = Property & {
  type: "relation";
  to: string;
  mode: "single"|"multiple";
}

type SelectProperty = Property & {
  type: "select";
  options: string[];
  mode: "single"|"multiple";
}

type DateTimeProperty = Property & {
  type: "datetime";
}

type BooleanProperty = Property & {
  type: "boolean";
}

type EmailProperty = Property & {
  type: "email";
}

type UrlProperty = Property & {
  type: "url";
}

type RichTextProperty = Property & {
  type: "richText";
}

type JsonProperty = Property & {
  type: "json";
}

// TODO: File, GeoPoint, Autodate

// TODO: deal with multiple file

// TODO: wrapper hook that parses dates

const file = fs.readFileSync("./schema.yaml", "utf-8");
const parsed = yaml.parse(file) as { collections: Collection[] };
const typeTemplate = fs.readFileSync(path.join(__dirname, "templates", "type.mu")).toString();

fs.writeFileSync(
  "demo/src/api.ts",
  mustache.render(typeTemplate, {
    collections: parsed.collections.map((c) => ({
      ...c,
      singularUpperCase: upperCaseFirstChar(c.singular),
      pluralUpperCase: upperCaseFirstChar(c.plural),
      properties: c.properties.map((p) => ({
        ...p,
        parsedType: getParsedType(p),
        serializedType: getSerializedType(p),
        parser: getParser(p),
        serializer: getSerializer(p),
      })),
      includeExpand: c.properties.some((p) => p.type === "relation"),
      expand: c.properties
        .filter((p) => p.type === "relation")
        .map((p) => {
          const resolvedTo = parsed.collections.find((c) => c.name === p.to);

          if (!resolvedTo) {
            throw new Error(`Invalid referenced collection "${p.to}" in property ${p.name}`);
          }

          return {
            ...p,
            resolvedTo: upperCaseFirstChar(resolvedTo.singular),
            isMultiple: p.mode === "multiple",
          };
        })
      ,
    })),
  })
);

function getParsedType(prop: AnyProperty): string {
  switch (prop.type) {
    case "relation": {
      switch (prop.mode) {
        case "single": return "string";
        case "multiple": return "string[]";
        default: throw new Error(`Invalid relation mode "${prop.mode}" in property ${prop.name}`);
      }
    }
    case "select": {
      const options = prop.options.map((o) => `"${o}"`).join("|");
      switch (prop.mode) {
        case "single": return options;
        case "multiple": return `Array<${options}>`;
        default: throw new Error(`Invalid select mode "${prop.mode} in property ${prop.name}"`);
      }
    }
    case "datetime": return "Date";
    case "email": return "string";
    case "url": return "string";
    case "richText": return "string";
    case "plainText": return "string";
    case "json": return "unknown";
    default: throw new Error(`Invalid property type: "${prop.type}" in ${prop.name}`);
  }
}

function getSerializedType(prop: AnyProperty): string {
  switch (prop.type) {
    case "relation": {
      switch (prop.mode) {
        case "single": return "string";
        case "multiple": return "string[]";
        default: throw new Error(`Invalid relation mode "${prop.mode}" in property ${prop.name}`);
      }
    }
    case "select": {
      const options = prop.options.map((o) => `"${o}"`).join("|");
      switch (prop.mode) {
        case "single": return options;
        case "multiple": return `Array<${options}>`;
        default: throw new Error(`Invalid select mode "${prop.mode} in property ${prop.name}"`);
      }
    }
    case "datetime": return "string";
    case "email": return "string";
    case "url": return "string";
    case "richText": return "string";
    case "plainText": return "string";
    case "json": return "unknown";
    default: throw new Error(`Invalid property type: "${prop.type}" in ${prop.name}`);
  }
}

function getParser(prop: AnyProperty): string|null {
  switch (prop.type) {
    case "datetime": return `parseISO(record.${prop.name})`;
    default: return null;
  }
}

function getSerializer(prop: AnyProperty): string|null {
  switch (prop.type) {
    case "datetime": return `formatISO(record.${prop.name})`;
    default: return null;
  }
}

function upperCaseFirstChar(str: string): string {
  if (str.length === 0) {
    return "";
  }

  return str[0]!.toUpperCase() + str.slice(1);
}

