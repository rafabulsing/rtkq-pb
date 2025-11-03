import fs from "fs";
import path from "path";
import mustache from "mustache";
import assert from "assert";
import Database from "better-sqlite3";

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

  hasProperty<P extends string, T>(field: UnknownField, property: P, type: string): field is UnknownField & { [x in P]: T } {
    if (!(property in field)) {
      throw this.missingPropertyError(field, property);
    }
 
    if (typeof field[property] !== type) {
      throw this.invalidPropertyTypeError(field, property, type);
    }

    return true;
  }

  hasBooleanProperty<P extends string>(field: UnknownField, property: P): field is UnknownField & { [x in P]: boolean } {
    return this.hasProperty<P, boolean>(field, property, "boolean");
  }

  hasStringProperty<P extends string>(field: UnknownField, property: P): field is UnknownField & { [x in P]: string } {
    return this.hasProperty<P, boolean>(field, property, "string");
  }

  hasNumberProperty<P extends string>(field: UnknownField, property: P): field is UnknownField & { [x in P]: number } {
    return this.hasProperty<P, number>(field, property, "number");
  }

  hasNonEmptyStringProperty<P extends string>(field: UnknownField, property: P): field is UnknownField & { [x in P]: string } {
    if (!this.hasStringProperty<P>(field, property)) {
      assert(false);
    }
    if (field[property] === "") {
      throw this.emptyStringPropertyMsg(field, property);
    }
    return true;
  }

  hasEnumStringProperty<P extends string, O extends string>(field: UnknownField, property: P, enumValues: readonly O[]): field is UnknownField & { [x in P]: O } {
    if (!this.hasNonEmptyStringProperty<P>(field, property)) {
      assert(false);
    }
    if (!enumValues.includes(field[property] as any)) {
      throw this.invalidEnumPropertyError(field, property, enumValues);
    }
    return true;
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
  static readonly type = "text" as string;
  readonly required: boolean;
  constructor(field: UnknownField) {
    super(field);

    if (!this.hasProperty<"required", boolean>(field, "required", "boolean")) {
      assert(false);
    }

    this.required = field.required;
  }
  getParsedType(): string {
    return "string";
  }
  getSerializedType(): string {
    return "string";
  }
  getTsDoc(): string | null {
    if (this.required) {
      return `/** Must not be empty string. **/`;
    }
    return null;
  }
}

abstract class SpecialTextField extends Field {
  readonly required: boolean;
  abstract readonly flavorType: string;

  constructor(field: UnknownField) {
    super(field);

    if (!this.hasBooleanProperty<"required">(field, "required")) {
      assert(false);
    }

    this.required = field.required;
  }

  getParsedType(): string {
    if (this.required) {
      return this.flavorType;
    }
    return `${this.flavorType}|null`;
  }

  getSerializedType(): string {
    return "string";
  }

  getParser(): string | null {
    if (this.required) {
      return null;
    }
    return `${this.name}: record.${this.name} === "" ? null : record.${this.name},`;
  }

  getSerializer(): string | null {
    if (this.required) {
      return null;
    }
    return `${this.name}: record.${this.name} ?? "",`;
  }

  getTsDoc(): string | null {
    return null;
  }
}

class RichTextField extends SpecialTextField {
  static readonly type = "editor";
  readonly flavorType = "RichText";
}

class EmailField extends SpecialTextField {
  static readonly type = "email";
  readonly flavorType = "Email";
}

class UrlField extends SpecialTextField {
  static readonly type = "url";
  readonly flavorType = "Url";
}

class NumberField extends Field {
  static readonly type = "number";
  required: boolean;

  constructor(field: UnknownField) {
    super(field);

    if (!this.hasBooleanProperty<"required">(field, "required")) {
      assert(false);
    }

    this.required = field.required;
  }
  getParsedType(): string {
    return "number";
  }
  getSerializedType(): string {
    return "number";
  }
  getTsDoc(): string|null {
    if (this.required) {
      return `/** Must be nonzero. */`;
    }
    return null;
  }
}

class RelationField extends Field {
  static readonly type = "relation";
  collectionId: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;

  constructor(field: UnknownField) {
    super(field);
    if (!this.hasNonEmptyStringProperty<"collectionId">(field, "collectionId")) {
      assert(false);
    }

    if (!this.hasNumberProperty<"minSelect">(field, "minSelect")) {
      assert(false);
    }

    if (!this.hasNumberProperty<"maxSelect">(field, "maxSelect")) {
      assert(false);
    }

    if (!this.hasBooleanProperty<"required">(field, "required")) {
      assert(false);
    }
    
    this.collectionId = field.collectionId;
    this.minSelect = field.minSelect;
    this.maxSelect = field.maxSelect;
    this.required = field.required;
  }

  getParsedType(): string {
    return this.maxSelect === 1
      ? (this.required ? "Relation" : "Relation|null")
      : (this.required ? "Relation[]" : "Relation[]|null")
    ;
  }

  getSerializedType(): string {
    return this.maxSelect === 1
      ? "string"
      : "string[]"
    ;
  }

  getParser(): string | null {
    if (this.required) {
      return null;
    }

    if (this.maxSelect === 1) {
      return `${this.name}: record.${this.name} === "" ? null : record.${this.name},`;
    }

    return `${this.name}: record.${this.name}.length === 0 ? null : record.${this.name},`;
  }

  getSerializer(): string | null {
    if (this.required) {
      return null;
    }

    if (this.maxSelect === 1) {
      return `${this.name}: record.${this.name} ?? "",`;
    }

    return `${this.name}: record.${this.name} ?? [],`;
  }
}

class DateTimeField extends Field {
  static readonly type = "date";
  required: boolean;

  constructor(field: UnknownField) {
    super(field);

    if (!this.hasBooleanProperty<"required">(field, "required")) {
      assert(false);
    }
    
    this.required = field.required;
  }

  getParsedType(): string {
    if (this.required) {
      return "Date";
    }
    return "Date|null";
  }

  getSerializedType(): string {
    return "string";
  }

  getParser(): string | null {
    if (this.required) {
      return `${this.name}: parseISO(record.${this.name}),`;
    }
    
    return `${this.name}: record.${this.name} === "" ? null : parseISO(record.${this.name}),`;
  }

  getSerializer(): string | null {
    if (this.required) {
      return `${this.name}: formatISO(record.${this.name}),`;
    }
    return `${this.name}: record.${this.name} ? formatISO(record.${this.name}) : "",`;
  }
}

class AutoDateTimeField extends Field {
  static readonly type = "autodate";

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
  static readonly type = "bool";
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
  values: string[];
  maxSelect: number;

  constructor(field: UnknownField) {
    super(field);
    if (!("values" in field)) {
      throw this.missingPropertyError(field, "values");
    }

    if (!Array.isArray(field.values)) {
      throw this.invalidPropertyTypeError(field, "values", "non-empty array of strings");
    }

    if (field.values.length === 0) {
      throw this.emptyArrayPropertyError(field, "values", "strings");
    }

    const invalidOption = field.values.find(v => typeof v !== "string");
    if (invalidOption) {
      throw this.invalidArrayElementTypeError(field, "values", invalidOption, "non-empty strings");
    }

    const emptyStringOption = field.values.some(v => v === "");
    if (emptyStringOption) {
      throw this.emptyStringInArrayError(field, "values");
    }

    if (!this.hasNumberProperty(field, "maxSelect")) {
      assert(false);
    }

    this.values = field.values;
    this.maxSelect = field.maxSelect;
  }

  getParsedType(): string {
    const valuesType = this.values.map((v) => `"${v}"`).join("|");

    return this.maxSelect === 1
      ? valuesType
      : `Array<${valuesType}>`
    ;
  }

  getSerializedType(): string {
    const valuesType = this.values.map((v) => `"${v}"`).join("|");

    return this.maxSelect === 1
      ? valuesType
      : `Array<${valuesType}>`
    ;
  }
}

class FileField extends Field {
  static readonly type = "file";
  maxSelect: number;

  constructor(field: UnknownField) {
    super(field);

    if (!this.hasNumberProperty(field, "maxSelect")) {
      assert(false);
    }

    this.maxSelect = field.maxSelect;
  }

  getParsedType(): string {
    return this.maxSelect === 1
      ? "string"
      : "string[]"
    ;
  }

  getSerializedType(): string {
    return this.maxSelect === 1
      ? "string"
      : "string[]"
    ;
  }

  getCreateParsedType(): string {
    return this.maxSelect === 1
      ? "File"
      : "File[]"
    ;
  }

  getCreateSerializedType(): string {
    return this.maxSelect === 1
      ? "File"
      : "File[]"
    ;
  }

  getUpdateParsedType(): string {
    return this.maxSelect === 1
      ? "File|undefined|\"\""
      : "File[]|undefined|[]"
    ;
  }

  getUpdateSerializedType(): string {
    return this.maxSelect === 1
      ? "File|undefined|\"\""
      : "File[]|undefined|[]"
    ;
  }

  getUpdateParsed(): string {
    return this.maxSelect === 1
      ? super.getUpdateParsed()!
      : super.getUpdateParsed() + `
  ${this.name}Append?: File[];
  ${this.name}Prepend?: File[];
  ${this.name}Remove?: string[];`
    ;
  }

  getUpdateSerialized(): string {
    return this.maxSelect === 1
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

class PasswordField extends Field {
  static readonly type = "password";
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
  PasswordField,
];

const fieldClassesMap = Object.fromEntries(
  fieldClasses.map((fieldType) => [fieldType.type, fieldType]),
);

// TODO: deal with optional files

// TODO: typecheck error in wrapper hooks

// TODO: handle tag invalidation for back relations

export function schemaToTypes(collections: DbCollection[]): string {
  const typeTemplate = fs.readFileSync(path.join(__dirname, "templates", "type.mu")).toString();
  
  return mustache.render(typeTemplate, {
    collections: collections.map((c) => {
      let fields: Field[];
      try {
        fields = c.fields.map(parseField);
      } catch (err) {
        throw new Error(`Collection ${c.name}: Failed to parse fields`, { cause: err });
      }

      return {
        name: c.name,
        singular: c.name,
        plural: c.name,
        singularUpperCase: upperCaseFirstChar(c.name),
        pluralUpperCase: upperCaseFirstChar(c.name),
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
            const resolvedTo = collections.find((c) => c.id === f.collectionId);

            if (!resolvedTo) {
              throw new Error(`Collection ${c.name}: RelationField ${f.name} references non-existant collection "${f.collectionId}"`);
            }

            return {
              name: f.name,
              resolvedTo: upperCaseFirstChar(resolvedTo.name),
              resolvedToCollection: resolvedTo.name,
              collection: c.name,
              isMultiple: f.maxSelect > 1,
            };
          })
        ,
      };
    }),
  });
}

function upperCaseFirstChar(str: string): string {
  if (str.length === 0) {
    return "";
  }

  return str[0]!.toUpperCase() + str.slice(1);
}

export function dbToTypes(input: string, output: string) {
  const db = new Database(input, {
    readonly: true,
    fileMustExist: true,
  });

  const collections = (db
    .prepare(`SELECT * FROM _collections WHERE system = False`)
    .all() as RawDbCollection[])
    .map((c) => ({
      ...c,
      fields: (JSON.parse(c.fields) as UnknownDbField[]).filter((f) => f.name !== "id"),
    }))
  ;

  const types = schemaToTypes(collections);

  fs.writeFileSync(output, types);
}

type RawDbCollection = {
  id: string;
  system: boolean;
  type: "base"|"auth";
  name: string;
  fields: string;
}

type DbCollection = Omit<RawDbCollection, "fields"> & { fields: UnknownDbField[] };

type UnknownDbField = never
  | PlainTextDbField
  | RichTextDbField
  | NumberDbField
  | BooleanDbField
  | EmailDbField
  | UrlDbField
  | DateTimeDbField
  | AutoDateDbField
  | SelectDbField
  | FileDbField
  | RelationDbField
  | JsonDbField
  | GeoPointDbField
  | PasswordDbField
;

type DbField = {
  hidden: boolean;
  id: string;
  name: string;
  presentable: boolean;
  system: boolean;
  type: string;
}

type PlainTextDbField = DbField & {
  type: "text";
  autogeneratePattern: string;
  max: number;
  min: number;
  pattern: string;
  primaryKey: boolean;
  required: boolean;
}

type RichTextDbField = DbField & {
  type: "editor";
  autogeneratePattern: string;
  maxSize: number;
  required: boolean;
}

type NumberDbField = DbField & {
  type: "number";
  max: number|null;
  min: number|null;
  onlyInt: boolean;
  required: boolean;
}

type BooleanDbField = DbField & {
  type: "bool";
  required: boolean;
}

type EmailDbField = DbField & {
  type: "email";
  required: boolean;  
} & (
  {
    exceptDomains: string[];
    onlyDomains: null;
  } | {
    exceptDomains: null;
    onlyDomains: string[];
  } | {
    exceptDomains: null;
    onlyDomains: null;
  }
);

type UrlDbField = DbField & {
  type: "url";
  required: boolean;  
} & (
  {
    exceptDomains: string[];
    onlyDomains: null;
  } | {
    exceptDomains: null;
    onlyDomains: string[];
  } | {
    exceptDomains: null;
    onlyDomains: null;
  }
);

type DateTimeDbField = DbField & {
  type: "date";
  max: string;
  min: string;
  required: boolean;
}

type AutoDateDbField = DbField & {
  type: "autodate";
} & (
  {
    onCreate: true;
    onUpdte: true;
  } | {
    onCreate: true;
    onUpdate: false;
  } | {
    onCreate: false;
    onUpdate: true;
  }
)

type SelectDbField = DbField & {
  type: "select";
  maxSelect: number;
  values: string[];
  required: boolean;
}

type FileDbField = DbField & {
  type: "file";
  maxSelect: number;
  maxSize: number;
  mimeTypes: string[];
  protected: boolean;
  thumbs: string[];
  required: boolean;
}

type RelationDbField = DbField & {
  type: "relation";
  cascadeDelete: boolean;
  collectionId: string;
  maxSelect: number;
  minSelect: number;
  required: boolean;
}

type JsonDbField = DbField & {
  type: "json";
  maxSize: number;
  required: boolean;
}

type GeoPointDbField = DbField & {
  type: "geoPoint";
  required: boolean;
}

type PasswordDbField = DbField & {
  type: "password";
  cost: number;
  max: number;
  min: number;
  pattern: string;
  required: boolean;
}