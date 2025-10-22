"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const mustache_1 = __importDefault(require("mustache"));
class Field {
    name;
    static type;
    getCreateParsedType() {
        return this.getParsedType();
    }
    getCreateSerializedType() {
        return this.getSerializedType();
    }
    getUpdateParsedType() {
        return this.getParsedType();
    }
    getUpdateSerializedType() {
        return this.getSerializedType();
    }
    getParser() {
        return null;
    }
    getSerializer() {
        return null;
    }
    constructor(field) {
        this.name = field.name;
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
    static type = "plainText";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "string";
    }
    getSerializedType() {
        return "string";
    }
}
class RichTextField extends Field {
    static type = "richText";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "string";
    }
    getSerializedType() {
        return "string";
    }
}
class EmailField extends Field {
    static type = "email";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "string";
    }
    getSerializedType() {
        return "string";
    }
}
class UrlField extends Field {
    static type = "url";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "string";
    }
    getSerializedType() {
        return "string";
    }
}
class NumberField extends Field {
    static type = "number";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "number";
    }
    getSerializedType() {
        return "number";
    }
}
class RelationField extends Field {
    static type = "relation";
    to;
    mode;
    constructor(field) {
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
        this.mode = field.mode;
    }
    getParsedType() {
        return this.mode === "single"
            ? "string"
            : "string[]";
    }
    getSerializedType() {
        return this.mode === "single"
            ? "string"
            : "string[]";
    }
}
class DateTimeField extends Field {
    static type = "datetime";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "Date";
    }
    getSerializedType() {
        return "string";
    }
    getParser() {
        return `parseISO(record.${this.name})`;
    }
    getSerializer() {
        return `formatISO(record.${this.name})`;
    }
}
class BooleanField extends Field {
    static type = "boolean";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "boolean";
    }
    getSerializedType() {
        return "boolean";
    }
}
class JsonField extends Field {
    static type = "json";
    constructor(field) {
        super(field);
    }
    getParsedType() {
        return "unknown";
    }
    getSerializedType() {
        return "unknown";
    }
}
class SelectField extends Field {
    static type = "select";
    options;
    mode;
    constructor(field) {
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
        this.mode = field.mode;
    }
    getParsedType() {
        const optionsType = this.options.map((o) => `"${o}"`).join("|");
        return this.mode === "single"
            ? optionsType
            : `Array<${optionsType}>`;
    }
    getSerializedType() {
        const optionsType = this.options.map((o) => `"${o}"`).join("|");
        return this.mode === "single"
            ? optionsType
            : `Array<${optionsType}>`;
    }
}
class FileField extends Field {
    static type = "file";
    mode;
    constructor(field) {
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
        this.mode = field.mode;
    }
    getParsedType() {
        return this.mode === "single"
            ? "string"
            : "string[]";
    }
    getSerializedType() {
        return this.mode === "single"
            ? "string"
            : "string[]";
    }
    getCreateParsedType() {
        return this.mode === "single"
            ? "File"
            : "File[]";
    }
    getCreateSerializedType() {
        return this.mode === "single"
            ? "File"
            : "File[]";
    }
    getUpdateParsedType() {
        return this.mode === "single"
            ? "File|undefined|\"\""
            : "File[]|undefined|[]";
    }
    getUpdateSerializedType() {
        return this.mode === "single"
            ? "File|undefined|\"\""
            : "File[]|undefined|[]";
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
];
const fieldClassesMap = Object.fromEntries(fieldClasses.map((fieldType) => [fieldType.type, fieldType]));
// TODO: File, GeoPoint, Autodate
// TODO: deal with multiple file
// TODO: deal with optional files
// TODO: wrapper hook that parses dates
const file = fs_1.default.readFileSync("./schema.yaml", "utf-8");
const parsed = yaml_1.default.parse(file);
const typeTemplate = fs_1.default.readFileSync(path_1.default.join(__dirname, "templates", "type.mu")).toString();
fs_1.default.writeFileSync("demo/src/api.ts", mustache_1.default.render(typeTemplate, {
    collections: parsed.collections.map((c) => {
        let fields;
        try {
            fields = c.properties.map(parseField);
        }
        catch (err) {
            throw new Error(`Collection ${c.name}: Failed to parse fields`, { cause: err });
        }
        return {
            ...c,
            singularUpperCase: upperCaseFirstChar(c.singular),
            pluralUpperCase: upperCaseFirstChar(c.plural),
            fields: fields.map((f) => ({
                name: f.name,
                parsedType: f.getParsedType(),
                serializedType: f.getSerializedType(),
                createParsedType: f.getCreateParsedType(),
                createSerializedType: f.getCreateSerializedType(),
                updateParsedType: f.getUpdateParsedType(),
                updateSerializedType: f.getUpdateSerializedType(),
                isFile: f instanceof FileField,
                isMultiple: "mode" in f && f.mode === "multiple",
                parser: f.getParser(),
                serializer: f.getSerializer(),
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
                    isMultiple: f.mode === "multiple",
                };
            }),
        };
    }),
}));
function upperCaseFirstChar(str) {
    if (str.length === 0) {
        return "";
    }
    return str[0].toUpperCase() + str.slice(1);
}
//# sourceMappingURL=index.js.map