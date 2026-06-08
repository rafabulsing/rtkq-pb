"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaToTypes = schemaToTypes;
exports.dbToTypes = dbToTypes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mustache_1 = __importDefault(require("mustache"));
const assert_1 = __importDefault(require("assert"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class Field {
    name;
    static type;
    getCreateType() {
        return this.getType();
    }
    getUpdateType() {
        return this.getType();
    }
    getTypePrinted() {
        return `${this.name}: ${this.getType()};`;
    }
    getCreatePrinted() {
        return `${this.name}: ${this.getCreateType()};`;
    }
    getUpdatePrinted() {
        return `${this.name}?: ${this.getUpdateType()};`;
    }
    getTsDoc() {
        return null;
    }
    constructor(field) {
        this.name = field.name;
    }
    errorMsg(field, message) {
        return `${this.constructor.name} ${field.name}: ${message}`;
    }
    missingPropertyError(field, property) {
        return new Error(this.errorMsg(field, `Property "${property}" is missing`));
    }
    invalidPropertyTypeError(field, property, expected) {
        return new Error(this.errorMsg(field, `Property "${property}" is of type ${typeof field[property]}. Must be ${expected}`));
    }
    emptyStringPropertyMsg(field, property) {
        return new Error(this.errorMsg(field, `Property "${property} is empty string. Must be non-empty string`));
    }
    invalidEnumPropertyError(field, property, enumValues) {
        return new Error(this.errorMsg(field, `Property "${property}" is "${field[property]}". Must be one of ${JSON.stringify(enumValues)}`));
    }
    emptyArrayPropertyError(field, property, arrayElementType) {
        return new Error(this.errorMsg(field, `Property "${property} is empty array. Must be non-empty array of ${arrayElementType}`));
    }
    invalidArrayElementTypeError(field, property, value, expectedArrayElementType) {
        return new Error(this.errorMsg(field, `Property "${property}" contains value ${value} of type ${typeof value}. All values must be ${expectedArrayElementType}`));
    }
    emptyStringInArrayError(field, property) {
        return new Error(this.errorMsg(field, `Property "${property}" contains value empty string. All values must be non-empty strings`));
    }
    hasProperty(field, property, type) {
        if (!(property in field)) {
            throw this.missingPropertyError(field, property);
        }
        if (typeof field[property] !== type) {
            throw this.invalidPropertyTypeError(field, property, type);
        }
        return true;
    }
    hasBooleanProperty(field, property) {
        return this.hasProperty(field, property, "boolean");
    }
    hasStringProperty(field, property) {
        return this.hasProperty(field, property, "string");
    }
    hasNumberProperty(field, property) {
        return this.hasProperty(field, property, "number");
    }
    hasNonEmptyStringProperty(field, property) {
        if (!this.hasStringProperty(field, property)) {
            (0, assert_1.default)(false);
        }
        if (field[property] === "") {
            throw this.emptyStringPropertyMsg(field, property);
        }
        return true;
    }
    hasEnumStringProperty(field, property, enumValues) {
        if (!this.hasNonEmptyStringProperty(field, property)) {
            (0, assert_1.default)(false);
        }
        if (!enumValues.includes(field[property])) {
            throw this.invalidEnumPropertyError(field, property, enumValues);
        }
        return true;
    }
}
function parseField(field) {
    if (false
        || !field
        || typeof field !== "object") {
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
    const uField = field;
    const FieldClass = fieldClassesMap[uField.type];
    if (FieldClass === undefined) {
        throw new Error(`Field ${field.name}: Invalid type "${uField.type}"`);
    }
    return new FieldClass(uField);
}
class PlainTextField extends Field {
    static type = "text";
    required;
    constructor(field) {
        super(field);
        if (!this.hasProperty(field, "required", "boolean")) {
            (0, assert_1.default)(false);
        }
        this.required = field.required;
    }
    getType() {
        return "string";
    }
    getTsDoc() {
        if (this.required) {
            return `/** Must not be empty string. **/`;
        }
        return null;
    }
    getCreateType() {
        if (this.required) {
            return "string";
        }
        return "string|undefined";
    }
    getCreatePrinted() {
        return `${this.name}${this.required ? "" : "?"}: ${this.getCreateType()}`;
    }
}
class SpecialTextField extends Field {
    required;
    constructor(field) {
        super(field);
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.required = field.required;
    }
    getType() {
        return "string";
    }
    getTsDoc() {
        return null;
    }
    getCreateType() {
        if (this.required) {
            return "string";
        }
        return "string|undefined";
    }
    getCreatePrinted() {
        return `${this.name}${this.required ? "" : "?"}: ${this.getCreateType()}`;
    }
}
class RichTextField extends SpecialTextField {
    static type = "editor";
    flavorType = "RichText";
}
class EmailField extends SpecialTextField {
    static type = "email";
    flavorType = "Email";
}
class UrlField extends SpecialTextField {
    static type = "url";
    flavorType = "Url";
}
class NumberField extends Field {
    static type = "number";
    required;
    constructor(field) {
        super(field);
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.required = field.required;
    }
    getType() {
        return "number";
    }
    getTsDoc() {
        if (this.required) {
            return `/** Must be nonzero. */`;
        }
        return null;
    }
}
class RelationField extends Field {
    static type = "relation";
    collectionId;
    minSelect;
    maxSelect;
    required;
    constructor(field) {
        super(field);
        if (!this.hasNonEmptyStringProperty(field, "collectionId")) {
            (0, assert_1.default)(false);
        }
        if (!this.hasNumberProperty(field, "minSelect")) {
            (0, assert_1.default)(false);
        }
        if (!this.hasNumberProperty(field, "maxSelect")) {
            (0, assert_1.default)(false);
        }
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.collectionId = field.collectionId;
        this.minSelect = field.minSelect;
        this.maxSelect = field.maxSelect;
        this.required = field.required;
    }
    getType() {
        return this.maxSelect === 1
            ? "string"
            : "string[]";
    }
    getCreateType() {
        return this.getType() + (this.required ? "" : "|undefined");
    }
    getCreatePrinted() {
        return `${this.name}${this.required ? "" : "?"}: ${this.getCreateType()}`;
    }
}
class DateTimeField extends Field {
    static type = "date";
    required;
    constructor(field) {
        super(field);
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.required = field.required;
    }
    getType() {
        return "string";
    }
    getCreateType() {
        return this.getType() + (this.required ? "" : "|undefined");
    }
    getCreatePrinted() {
        return `${this.name}${this.required ? "" : "?"}: ${this.getCreateType()}`;
    }
}
class AutoDateTimeField extends Field {
    static type = "autodate";
    constructor(field) {
        super(field);
    }
    getType() {
        return "string";
    }
    getCreatePrinted() {
        return null;
    }
    getUpdatePrinted() {
        return null;
    }
}
class BooleanField extends Field {
    static type = "bool";
    constructor(field) {
        super(field);
    }
    getType() {
        return "boolean";
    }
}
class JsonField extends Field {
    static type = "json";
    constructor(field) {
        super(field);
    }
    getType() {
        return "unknown";
    }
}
class SelectField extends Field {
    static type = "select";
    values;
    maxSelect;
    required;
    constructor(field) {
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
            (0, assert_1.default)(false);
        }
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.values = field.values;
        this.maxSelect = field.maxSelect;
        this.required = field.required;
    }
    getType() {
        const valuesType = this.values.map((v) => `"${v}"`).join("|");
        return this.maxSelect === 1
            ? valuesType
            : `Array<${valuesType}>`;
    }
    getCreateType() {
        return this.getType() + (this.required ? "" : "|undefined");
    }
    getCreatePrinted() {
        return `${this.name}${this.required ? "" : "?"}: ${this.getCreateType()}`;
    }
}
class FileField extends Field {
    static type = "file";
    maxSelect;
    required;
    constructor(field) {
        super(field);
        if (!this.hasNumberProperty(field, "maxSelect")) {
            (0, assert_1.default)(false);
        }
        if (!this.hasBooleanProperty(field, "required")) {
            (0, assert_1.default)(false);
        }
        this.maxSelect = field.maxSelect;
        this.required = field.required;
    }
    getType() {
        return this.maxSelect === 1
            ? "string"
            : "string[]";
    }
    getCreateType() {
        return this.getType() + (this.required ? "" : "|undefined");
    }
    getUpdateType() {
        return this.maxSelect === 1
            ? "File|undefined|\"\""
            : "File[]|undefined|[]";
    }
    getUpdatePrinted() {
        return this.maxSelect === 1
            ? super.getUpdatePrinted()
            : super.getUpdatePrinted() + `
  "${this.name}+"?: File[];
  "+${this.name}"?: File[];
  "${this.name}-"?: string[];`;
    }
}
class GeoPointField extends Field {
    static type = "geoPoint";
    constructor(field) {
        super(field);
    }
    getType() {
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
const fieldClassesMap = Object.fromEntries(fieldClasses.map((fieldType) => [fieldType.type, fieldType]));
function schemaToTypes(collections, options) {
    const typeTemplate = fs_1.default.readFileSync(path_1.default.join(__dirname, "templates", "type.mu")).toString();
    return mustache_1.default.render(typeTemplate, {
        collections: collections.map((c) => {
            let fields;
            try {
                fields = c.fields.map(parseField);
            }
            catch (err) {
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
                    return parsed instanceof RelationField && parsed.collectionId === c.id;
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
                    }),
                    // Back relations
                    ...collections
                        .map((col) => col.fields
                        .map(parseField)
                        .filter((f) => f instanceof RelationField)
                        .filter((f) => f.collectionId === c.id)
                        .map((f) => ({ col, f })))
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
                    }),
                ],
            };
        }),
        options,
    });
}
function logAndReturn(arg) {
    console.log(arg);
    return arg;
}
function upperCaseFirstChar(str) {
    if (str.length === 0) {
        return "";
    }
    return str[0].toUpperCase() + str.slice(1);
}
function dbToTypes(dbPath, outputPath, configPath) {
    const db = new better_sqlite3_1.default(dbPath, {
        readonly: true,
        fileMustExist: true,
    });
    const config = JSON.parse(fs_1.default.readFileSync(configPath).toString());
    const collections = db
        .prepare(`SELECT * FROM _collections WHERE system = False`)
        .all()
        .map((c) => ({
        ...c,
        fields: JSON.parse(c.fields)
            .filter((f) => !f.system),
        // Get names from config, otherwise infer them if options allow it
        config: config.collections[c.name]
            ?? (!config.options.inferRecordNames ? undefined : {
                singular: c.name.slice(0, -1),
                plural: c.name,
            }),
    }));
    const missingConfig = collections.find((c) => !c.config);
    if (missingConfig) {
        console.log(`Did not find config for collection ${missingConfig.name}`);
        return;
    }
    const types = schemaToTypes(collections, config.options);
    fs_1.default.writeFileSync(outputPath, types);
}
//# sourceMappingURL=index.js.map