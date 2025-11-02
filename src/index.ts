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

  getTsDoc(): string|null {
    return null;
  }

  constructor(field: UnknownField) {
    this.name = field.name;
  }

  errorMsg(field: UnknownField, message: string): string {
    return `${this.constructor.name} ${field.name}: ${message}`;
  }

  missingPropertyError(field: UnknownField, property: string): Error {
    return new Error(this.errorMsg(field, `Property "${property}" is missing`));
  }

  invalidPropertyTypeError(field: UnknownField, property: string, expected: string): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property}" is of type ${typeof field[property]}. Must be ${expected}`,
    ));
  }

  emptyStringPropertyMsg(field: UnknownField, property: string): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property} is empty string. Must be non-empty string`,
    ));
  }

  invalidEnumPropertyError(field: UnknownField, property: string, enumValues: readonly string[]): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property}" is "${field[property]}". Must be one of ${JSON.stringify(enumValues)}`,
    ));
  }

  emptyArrayPropertyError(field: UnknownField, property: string, arrayElementType: string): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property} is empty array. Must be non-empty array of ${arrayElementType}`,
    ));
  }

  invalidArrayElementTypeError(field: UnknownField, property: string, value: unknown, expectedArrayElementType: string): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property}" contains value ${value} of type ${typeof value}. All values must be ${expectedArrayElementType}`,
    ));
  }

  emptyStringInArrayError(field: UnknownField, property: string): Error {
    return new Error(this.errorMsg(
      field,
      `Property "${property}" contains value empty string. All values must be non-empty strings`,
    ));
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
  static readonly type = "plainText" as string;
  readonly nonEmpty: boolean;
  constructor(field: UnknownField) {
    super(field);

    if (!("nonEmpty" in field)) {
      throw this.missingPropertyError(field, "nonEmpty");
    }

    if (typeof field.nonEmpty !== "boolean") {
      throw this.invalidPropertyTypeError(field, "nonEmpty", "boolean");
    }

    this.nonEmpty = field.nonEmpty;
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
  getTsDoc(): string | null {
    if (this.nonEmpty) {
      return `/** Must not be empty string. **/`;
    }
    return null;
  }
}

class RichTextField extends PlainTextField {
  static readonly type = "richText";
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
  getTsDoc(): string | null {
    if (this.nonEmpty) {
      return "/** RichTextField. Must not be empty string. */";
    }
    return "/** RichTextField. */";
  }
}

class EmailField extends PlainTextField {
  static readonly type = "email";
  getParsedType(): string {
    if (this.nonEmpty) {
      return "string";
    }
    return "string|null";
  }
  getSerializedType(): string {
    if (this.nonEmpty) {
      return "string";
    }
    return "string|null";
  }
  getParser(): string | null {
    if (this.nonEmpty) {
      return null;
    }
    return `${this.name}: record.${this.name} === "" ? null : record.${this.name},`;
  }

  getSerializer(): string | null {
    if (this.nonEmpty) {
      return null;
    }
    return `${this.name}: record.${this.name} ?? "",`;
  }

  getTsDoc(): string | null {
    return "/** EmailField. */";
  }
}

class UrlField extends PlainTextField {
  static readonly type = "url";
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
  getTsDoc(): string | null {
    if (this.nonEmpty) {
      return "/** UrlField. Must not be empty string. */";
    }
    return "/** UrlField. */";
  }
}

class NumberField extends Field {
  static readonly type = "number";
  nonZero: boolean;

  constructor(field: UnknownField) {
    super(field);

    if (!("nonZero" in field)) {
      throw this.missingPropertyError(field, "nonZero");
    }

    if (typeof field.nonZero !== "boolean") {
      throw this.invalidPropertyTypeError(field, "nonZero", "boolean");
    }

    this.nonZero = field.nonZero;
  }
  getParsedType(): string {
    return "number";
  }
  getSerializedType(): string {
    return "number";
  }
  getTsDoc(): string|null {
    if (this.nonZero) {
      return `/** Must be nonzero. */`;
    }
    return null;
  }
}

class RelationField extends Field {
  static readonly type = "relation";
  to: string;
  mode: ArrayElement<typeof RelationField.modes>;
  static readonly modes = [
    "single",
    "multiple",
  ] as const;
  nonEmpty: boolean;

  constructor(field: UnknownField) {
    super(field);
    if (!("to" in field)) {
      throw this.missingPropertyError(field, "to");
    }

    if (typeof field.to !== "string") {
      throw this.invalidPropertyTypeError(field, "to", "non-empty string");
    }

    if (field.to === "") {
      throw this.emptyStringPropertyMsg(field, "to");
    }

    if (!("mode" in field)) {
      throw this.missingPropertyError(field, "mode");
    }

    if (typeof field.mode !== "string") {
      throw this.invalidPropertyTypeError(field, "mode", "non-empty string");
    }

    if (!["single", "multiple"].includes(field.mode)) {
      throw this.invalidEnumPropertyError(field, "mode", ["single", "multiple"]);
    }

    if (!("nonEmpty" in field)) {
      throw this.missingPropertyError(field, "nonEmpty");
    }

    if (typeof field.nonEmpty !== "boolean") {
      throw this.invalidPropertyTypeError(field, "nonEmpty", "boolean");
    }
    
    this.to = field.to;
    this.mode = field.mode as "single"|"multiple";
    this.nonEmpty = field.nonEmpty;
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

  getTsDoc(): string | null {
    if (this.nonEmpty) {
      return "/** Must be non-empty. */";
    }
    return null;
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
  mode: ArrayElement<typeof SelectField.modes>;
  static readonly modes = [
    "single",
    "multiple",
  ] as const;

  constructor(field: UnknownField) {
    super(field);
    if (!("options" in field)) {
      throw this.missingPropertyError(field, "options");
    }

    if (!Array.isArray(field.options)) {
      throw this.invalidPropertyTypeError(field, "options", "non-empty array of strings");
    }

    if (field.options.length === 0) {
      throw this.emptyArrayPropertyError(field, "options", "strings");
    }

    const invalidOption = field.options.find(o => typeof o !== "string");
    if (invalidOption) {
      throw this.invalidArrayElementTypeError(field, "options", invalidOption, "non-empty strings");
    }

    const emptyStringOption = field.options.some(o => o === "");
    if (emptyStringOption) {
      throw this.emptyStringInArrayError(field, "options");
    }

    if (!("mode" in field)) {
      throw this.missingPropertyError(field, "mode");
    }

    if (typeof field.mode !== "string") {
      throw this.invalidPropertyTypeError(field, "mode", `string, one of ${JSON.stringify(["single", "multiple"])}`);
    }

    if (!SelectField.modes.includes(field.mode as any)) {
      throw this.invalidEnumPropertyError(field, "mode", SelectField.modes);
    }

    this.options = field.options;
    this.mode = field.mode as ArrayElement<typeof SelectField.modes>;
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
  mode: ArrayElement<typeof FileField.modes>;
  static readonly modes = [
    "single",
    "multiple",
  ] as const;

  constructor(field: UnknownField) {
    super(field);

    if (!("mode" in field)) {
      throw this.missingPropertyError(field, "mode");
    }

    if (typeof field.mode !== "string") {
      throw this.invalidPropertyTypeError(field, "mode", `string, one of ${JSON.stringify(FileField.modes)}`);
    }

    if (!FileField.modes.includes(field.mode as any)) {
      throw this.invalidEnumPropertyError(field, "mode", FileField.modes);
    }

    this.mode = field.mode as ArrayElement<typeof FileField.modes>;
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
            tsDoc: f.getTsDoc(),
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
