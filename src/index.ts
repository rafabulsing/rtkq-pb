import fs from "fs";
import path from "path";
import mustache from "mustache";
import assert from "assert";
import Database from "better-sqlite3";

abstract class Field {
  readonly name: string;
  static readonly type: string;

  abstract getType(): string;

  getCreateType(): string {
    return this.getType();
  }

  getUpdateType(): string {
    return this.getType();
  }

  getTypePrinted(): string {
    return `${this.name}: ${this.getType()};`;
  }

  getCreatePrinted(): string|null {
    return `${this.name}: ${this.getUpdateType()};`;
  }

  getUpdatePrinted(): string|null {
    return `${this.name}?: ${this.getUpdateType()};`;
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
  getType(): string {
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

  getType(): string {
    return "string";
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
  getType(): string {
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

  getType(): string {
    return this.maxSelect === 1
      ? "string"
      : "string[]"
    ;
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

  getType(): string {
    return "string";
  }
}

class AutoDateTimeField extends Field {
  static readonly type = "autodate";

  constructor(field: UnknownField) {
    super(field);
  }

  getType(): string {
    return "string";
  }

  getCreatePrinted(): string|null {
    return null;
  }

  getUpdatePrinted(): string|null {
    return null;
  }
}

class BooleanField extends Field {
  static readonly type = "bool";
  constructor(field: UnknownField) {
    super(field);
  }
  getType(): string {
    return "boolean";
  }
}

class JsonField extends Field {
  static readonly type = "json";
  constructor(field: UnknownField) {
    super(field);
  }
  getType(): string {
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

  getType(): string {
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

  getType(): string {
    return this.maxSelect === 1
      ? "string"
      : "string[]"
    ;
  }

  getCreateType(): string {
    return this.maxSelect === 1
      ? "File"
      : "File[]"
    ;
  }

  getUpdateType(): string {
    return this.maxSelect === 1
      ? "File|undefined|\"\""
      : "File[]|undefined|[]"
    ;
  }

  getUpdatePrinted(): string {
    return this.maxSelect === 1
      ? super.getUpdatePrinted()!
      : super.getUpdatePrinted() + `
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
  getType(): string {
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

export function schemaToTypes(collections: DbCollection[], options: ConfigOptions): string {
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
        singular: c.config.singular,
        plural: c.config.plural,
        singularUpperCase: upperCaseFirstChar(c.config.singular),
        pluralUpperCase: upperCaseFirstChar(c.config.plural),
        isAuthCollection: c.type === "auth",
        fields: fields.map((f) => ({
          name: f.name,
          printed: f.getTypePrinted(),
          createPrinted: f.getCreatePrinted(),
          updatePrinted: f.getUpdatePrinted(),
          isFile: f instanceof FileField,
          isMultiple: "mode" in f && f.mode === "multiple",
          isAuto: f instanceof AutoDateTimeField,
          tsDoc: f.getTsDoc(),
        })),
        includeExpand: fields.some((f) => f instanceof RelationField) || collections.some((col) => col.fields.some((f) => {
          const parsed = parseField(f);
          return parsed instanceof RelationField && parsed.collectionId === c.id
        })),
        expand: [
          // Direct relations
          ...fields
            .filter((f) => f instanceof RelationField)
            .map((f) => {
              const resolvedTo = collections.find((c) => c.id === f.collectionId);

              if (!resolvedTo) {
                throw new Error(`Collection ${c.name}: RelationField ${f.name} references non-existant collection "${f.collectionId}"`);
              }

              return {
                name: f.name,
                singularUpperCase: upperCaseFirstChar(resolvedTo.config.singular),
                resolvedToCollection: resolvedTo.name,
                collection: c.name,
                isMultiple: f.maxSelect > 1,
                isRequired: f.minSelect > 0 || f.required,
              };
            })
          ,
          // Back relations
          ...collections
            .map((col) => col.fields
              .map(parseField)
              .filter((f) => f instanceof RelationField)
              .filter((f) => f.collectionId === c.id)
              .map((f) => ({ col, f }))
            )
            .flat()
            .map((br) => {
              return {
                name: `${br.col.name}_via_${br.f.name}`,
                singularUpperCase: upperCaseFirstChar(br.col.config.singular),
                resolvedToCollection: br.col.name,
                collection: br.col,
                isMultiple: true,
                isRequired: false,
              };
            })
          ,
        ],
      };
    }),
    options,
  });
}

function logAndReturn<T>(arg: T): T {
  console.log(arg);
  return arg;
}

function upperCaseFirstChar(str: string): string {
  if (str.length === 0) {
    return "";
  }

  return str[0]!.toUpperCase() + str.slice(1);
}

export function dbToTypes(dbPath: string, outputPath: string, configPath: string) {
  const db = new Database(dbPath, {
    readonly: true,
    fileMustExist: true,
  });

  const config: Config = JSON.parse(fs.readFileSync(configPath).toString());

  const collections = (db
    .prepare(`SELECT * FROM _collections WHERE system = False`)
    .all() as RawDbCollection[])
    .map((c) => ({
      ...c,
      fields: (JSON.parse(c.fields) as UnknownDbField[])
        .filter((f) => !f.system)
      ,
      // Get names from config, otherwise infer them if options allow it
      config: config.collections[c.name]
        ?? !config.options.inferRecordNames ? undefined : {
        singular: c.name.slice(0, -1),
        plural: c.name,
      },
    }))
  ;

  const missingConfig = collections.find((c) => !c.config)
  if (missingConfig) {
    console.log(`Did not find config for collection ${missingConfig.name}`);
    return;
  }

  const types = schemaToTypes(collections as DbCollection[], config.options);

  fs.writeFileSync(outputPath, types);
}

type RawDbCollection = {
  id: string;
  system: boolean;
  type: "base"|"auth";
  name: string;
  fields: string;
}

type DbCollection = Omit<RawDbCollection, "fields"> & {
  fields: UnknownDbField[],
  config: CollectionConfig,
};

type ConfigOptions = {
  inferRecordNames: boolean;
  importPocketbase?: string;
}

type Config = {
  options: ConfigOptions;
  collections: Record<string, CollectionConfig>;
}

type CollectionConfig = {
  singular: string;
  plural: string;
}

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