import fs from "fs";
import path from "path";
import yaml from "yaml";
import mustache from "mustache";

type Collection = {
  name: string;
  singular: string;
  plural: string;
  properties: UnknownField[];
}

abstract class Field {
  readonly name: string;
  static readonly type: string;

  abstract getParsedType(): string;
  abstract getSerializedType(): string;

  getCreateParsedType(): string {
    return this.getParsedType();
  }
  getCreateSerializedType(): string {
    return this.getSerializedType();
  }

  getUpdateParsedType(): string {
    return this.getParsedType();
  }
  getUpdateSerializedType(): string {
    return this.getSerializedType();
  }

  getParsed(): string {
    return `${this.name}: ${this.getParsedType()};`;
  }
  getSerialized(): string {
    return `${this.name}: ${this.getSerializedType()};`;
  }

  getCreateParsed(): string|null {
    return `${this.name}: ${this.getCreateParsedType()};`;
  }
  getCreateSerialized(): string|null {
    return `${this.name}: ${this.getUpdateSerializedType()};`;
  }

  getUpdateParsed(): string|null {
    return `${this.name}: ${this.getCreateParsedType()};`;
  }
  getUpdateSerialized(): string|null {
    return `${this.name}: ${this.getUpdateSerializedType()};`;
  }
  
  getParser(): string|null {
    return null;
  }
  getSerializer(): string|null {
    return null;
  }
  getCreateParser(): string|null {
    return this.getParser();
  }
  getCreateSerializer(): string|null {
    return this.getSerializer();
  }
  getUpdateParser(): string|null {
    return this.getParser();
  }
  getUpdateSerializer(): string|null {
    return this.getSerializer();
  }
  constructor(field: UnknownField) {
    this.name = field.name;
  }
}

function parseField(field: unknown): Field {
  if (false
    || !field
    || typeof field !== "object"
  ) {
    throw new Error("Invalid field");
  }

  if (!("name" in field)) {
    throw new Error("Missing field name");
  }

  if (typeof field.name !== "string") {
    throw new Error(`Field name must be a string (is of type ${typeof field.name})`);
  }

  if (field.name === "") {
    throw new Error(`Field name cannot be empty string`);
  }

  if (!("type" in field)) {
    throw new Error(`Field ${field.name}: type is missing`);
  }

  if (typeof field.type !== "string") {
    throw new Error(`Field ${field.name}: type is a ${typeof field.type}. Must be a non-empty string`);
  }

  if (field.type === "") {
    throw new Error(`Field ${field.name}: type is an empty string. Must be a non-empty string`);
  }

  const uField = field as UnknownField;

  const FieldClass = fieldClassesMap[uField.type];

  if (FieldClass === undefined) {
    throw new Error(`Field ${field.name}: Invalid type "${uField.type}"`);
  }

  return new FieldClass(uField);
}

type UnknownField = {
  type: string;
  name: string;
  [key: string]: unknown;
}

class PlainTextField extends Field {
  static readonly type = "plainText";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
}

class RichTextField extends Field {
  static readonly type = "richText";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
}

class EmailField extends Field {
  static readonly type = "email";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
}

class UrlField extends Field {
  static readonly type = "url";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
}

class NumberField extends Field {
  static readonly type = "number";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "number";
  }
  getSerializedType(): string {
    return "number";
  }
}

class RelationField extends Field {
  static readonly type = "relation";
  to: string;
  mode: "single"|"multiple";

  constructor(field: UnknownField) {
    super(field);
    if (!("to" in field)) {
      throw new Error(`RelationField ${field.name}: Property "to" is missing`);
    }

    if (typeof field.to !== "string") {
      throw new Error(`RelationField ${field.name}: Property "to" is of type ${typeof field.to}. Must be non-empty string`);
    }

    if (field.to === "") {
      throw new Error(`RelationField ${field.name}: Property "to" is an empty string. Must be non-empty string`);
    }

    if (!("mode" in field)) {
      throw new Error(`RelationField ${field.name}: Property "mode" is missing`);
    }

    if (typeof field.mode !== "string") {
      throw new Error(`RelationField ${field.name}: Property "mode" is of type ${typeof field.mode}. Must be a string, either "single" or "multiple"`);
    }

    if (!["single", "multiple"].includes(field.mode)) {
      throw new Error(`RelationField ${field.name}: Property "mode" is "${field.mode}". Must be either "single" or "multiple"`);
    }

    this.to = field.to;
    this.mode = field.mode as "single"|"multiple";
  }

  getParsedType(): string {
    return this.mode === "single"
      ? "string"
      : "string[]"
    ;
  }

  getSerializedType(): string {
    return this.mode === "single"
      ? "string"
      : "string[]"
    ;
  }
}

class DateTimeField extends Field {
  static readonly type = "datetime";

  constructor(field: UnknownField) {
    super(field);
  }

  getParsedType(): string {
    return "Date";
  }

  getSerializedType(): string {
    return "string";
  }

  getParser(): string | null {
    return `${this.name}: parseISO(record.${this.name}),`;
  }

  getSerializer(): string | null {
    return `${this.name}: formatISO(record.${this.name}),`;
  }
}

class AutoDateTimeField extends Field {
  static readonly type = "autoDatetime";

  constructor(field: UnknownField) {
    super(field);
  }

  getParsedType(): string {
    return "Date";
  }

  getSerializedType(): string {
    return "string";
  }

  getParser(): string | null {
    return `${this.name}: parseISO(record.${this.name}),`;
  }

  getSerializer(): string | null {
    return `${this.name}: formatISO(record.${this.name}),`;
  }

  getCreateParser(): string|null {
    return null;
  }
  getCreateSerializer(): string|null {
    return null;
  }
  getUpdateParser(): string|null {
    return null;
  }
  getUpdateSerializer(): string|null {
    return null;
  }

  getCreateParsed(): string|null {
    return null;
  }

  getCreateSerialized(): string|null {
    return null;
  }

  getUpdateParsed(): string|null {
    return null;
  }

  getUpdateSerialized(): string|null {
    return null;
  }
}

class BooleanField extends Field {
  static readonly type = "boolean";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "boolean";
  }
  getSerializedType(): string {
    return "boolean";
  }
}

class JsonField extends Field {
  static readonly type = "json";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "unknown";
  }
  getSerializedType(): string {
    return "unknown";
  }
}

class SelectField extends Field {
  static readonly type = "select";
  options: string[];
  mode: "single"|"multiple";

  constructor(field: UnknownField) {
    super(field);
    if (!("options" in field)) {
      throw new Error(`SelectField ${field.name}: Property "options" is missing`);
    }

    if (!Array.isArray(field.options)) {
      throw new Error(`SelectField ${field.name}: Property "options" is of type ${typeof field.options}. Must be a non-empty array of strings`);
    }

    if (field.options.length === 0) {
      throw new Error(`SelectField ${field.name}: Property "options" is empty array. Must be a non-empty array of strings`);
    }

    const invalidOption = field.options.find(o => typeof o !== "string");
    if (invalidOption) {
      throw new Error(`SelectField ${field.name}: Property "options" contains non-string value ${invalidOption}. All options must be non-empty strings`);
    }

    const emptyStringOption = field.options.some(o => o === "");
    if (emptyStringOption) {
      throw new Error(`SelectField ${field.name}: Property "options" contains an empty string. All options must be non-empty strings`);
    }

    if (!("mode" in field)) {
      throw new Error(`SelectField ${field.name}: Property "mode" is missing`);
    }

    if (typeof field.mode !== "string") {
      throw new Error(`SelectField ${field.name}: Property "mode" is of type ${typeof field.mode}. Must be a string, either "single" or "multiple"`);
    }

    if (!["single", "multiple"].includes(field.mode)) {
      throw new Error(`SelectField ${field.name}: Property "mode" is "${field.mode}". Must be either "single" or "multiple"`);
    }

    this.options = field.options;
    this.mode = field.mode as "single"|"multiple";
  }

  getParsedType(): string {
    const optionsType = this.options.map((o) => `"${o}"`).join("|");

    return this.mode === "single"
      ? optionsType
      : `Array<${optionsType}>`
    ;
  }

  getSerializedType(): string {
    const optionsType = this.options.map((o) => `"${o}"`).join("|");

    return this.mode === "single"
      ? optionsType
      : `Array<${optionsType}>`
    ;
  }
}

class FileField extends Field {
  static readonly type = "file";
  mode: "single"|"multiple";

  constructor(field: UnknownField) {
    super(field);

    if (!("mode" in field)) {
      throw new Error(`FileField ${field.name}: Property "mode" is missing`);
    }

    if (typeof field.mode !== "string") {
      throw new Error(`FileField ${field.name}: Property "mode" is of type ${typeof field.mode}. Must be a string, either "single" or "multiple"`);
    }

    if (!["single", "multiple"].includes(field.mode)) {
      throw new Error(`FileField ${field.name}: Property "mode" is "${field.mode}". Must be either "single" or "multiple"`);
    }

    this.mode = field.mode as "single"|"multiple";
  }

  getParsedType(): string {
    return this.mode === "single"
      ? "string"
      : "string[]"
    ;
  }

  getSerializedType(): string {
    return this.mode === "single"
      ? "string"
      : "string[]"
    ;
  }

  getCreateParsedType(): string {
    return this.mode === "single"
      ? "File"
      : "File[]"
    ;
  }

  getCreateSerializedType(): string {
    return this.mode === "single"
      ? "File"
      : "File[]"
    ;
  }

  getUpdateParsedType(): string {
    return this.mode === "single"
      ? "File|undefined|\"\""
      : "File[]|undefined|[]"
    ;
  }

  getUpdateSerializedType(): string {
    return this.mode === "single"
      ? "File|undefined|\"\""
      : "File[]|undefined|[]"
    ;
  }

  getUpdateParsed(): string {
    return this.mode === "single"
      ? super.getUpdateParsed()!
      : super.getUpdateParsed() + `
  ${this.name}Append?: File[];
  ${this.name}Prepend?: File[];
  ${this.name}Remove?: string[];`
    ;
  }

  getUpdateSerialized(): string {
    return this.mode === "single"
      ? super.getUpdateSerialized()!
      : super.getUpdateSerialized() + `
  "${this.name}+"?: File[];
  "+${this.name}"?: File[];
  "${this.name}-"?: string[];`
    ;
  }
}

class GeoPointField extends Field {
  static readonly type = "geoPoint";
  constructor(field: UnknownField) {
    super(field);
  }
  getParsedType(): string {
    return "{ lat: number, lon: number }";
  }
  getSerializedType(): string {
    return "{ lat: number, lon: number }";
  }
}

const fieldClasses = [
  PlainTextField,
  RichTextField,
  EmailField,
  UrlField,
  NumberField,
  RelationField,
  DateTimeField,
  BooleanField,
  JsonField,
  SelectField,
  FileField,
  AutoDateTimeField,
  GeoPointField,
];

const fieldClassesMap = Object.fromEntries(
  fieldClasses.map((fieldType) => [fieldType.type, fieldType]),
);

// TODO: deal with optional files

// TODO: typecheck error in wrapper hooks

// TODO: handle tag invalidation for back relations

export function schemaToTypes(inputFilePath: string, outputFilePath: string) {
  const file = fs.readFileSync(inputFilePath, "utf-8");
  const parsed = yaml.parse(file) as { collections: Collection[] };
  const typeTemplate = fs.readFileSync(path.join(__dirname, "templates", "type.mu")).toString();
  
  fs.writeFileSync(
    outputFilePath,
    mustache.render(typeTemplate, {
      collections: parsed.collections.map((c) => {
        let fields: Field[];
        try {
          fields = c.properties.map(parseField);
        } catch (err) {
          throw new Error(`Collection ${c.name}: Failed to parse fields`, { cause: err });
        }
  
        return {
          ...c,
          singularUpperCase: upperCaseFirstChar(c.singular),
          pluralUpperCase: upperCaseFirstChar(c.plural),
          fields: fields.map((f) => ({
            name: f.name,
            parsed: f.getParsed(),
            serialized: f.getSerialized(),
            createParsed: f.getCreateParsed(),
            createSerialized: f.getCreateSerialized(),
            updateParsed: f.getUpdateParsed(),
            updateSerialized: f.getUpdateSerialized(),
            isFile: f instanceof FileField,
            isMultiple: "mode" in f && f.mode === "multiple",
            isAuto: f instanceof AutoDateTimeField,
            parser: f.getParser(),
            serializer: f.getSerializer(),
            createParser: f.getCreateParser(),
            createSerializer: f.getCreateSerializer(),
            updateParser: f.getUpdateParser(),
            updateSerializer: f.getUpdateSerializer(),
          })),
          includeExpand: fields.some((f) => f instanceof RelationField),
          expand: fields
            .filter((f) => f instanceof RelationField)
            .map((f) => {
              const resolvedTo = parsed.collections.find((c) => c.name === f.to);
  
              if (!resolvedTo) {
                throw new Error(`Collection ${c.name}: RelationField ${f.name} references non-existant collection "${f.to}"`);
              }
  
              return {
                name: f.name,
                resolvedTo: upperCaseFirstChar(resolvedTo.singular),
                resolvedToCollection: resolvedTo.name,
                collection: c.singular,
                isMultiple: f.mode === "multiple",
              };
            })
          ,
        };
      }),
    })
  );
}


function upperCaseFirstChar(str: string): string {
  if (str.length === 0) {
    return "";
  }

  return str[0]!.toUpperCase() + str.slice(1);
}
