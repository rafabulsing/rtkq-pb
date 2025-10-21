"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const mustache_1 = __importDefault(require("mustache"));
// TODO: File, GeoPoint, Autodate
// TODO: deal with multiple file
// TODO: wrapper hook that parses dates
const file = fs_1.default.readFileSync("./schema.yaml", "utf-8");
const parsed = yaml_1.default.parse(file);
const typeTemplate = fs_1.default.readFileSync(path_1.default.join(__dirname, "templates", "type.mu")).toString();
fs_1.default.writeFileSync("demo/src/api.ts", mustache_1.default.render(typeTemplate, {
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
        }),
    })),
}));
function getParsedType(prop) {
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
function getSerializedType(prop) {
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
function getParser(prop) {
    switch (prop.type) {
        case "datetime": return `parseISO(record.${prop.name})`;
        default: return null;
    }
}
function getSerializer(prop) {
    switch (prop.type) {
        case "datetime": return `formatISO(record.${prop.name})`;
        default: return null;
    }
}
function upperCaseFirstChar(str) {
    if (str.length === 0) {
        return "";
    }
    return str[0].toUpperCase() + str.slice(1);
}
//# sourceMappingURL=index.js.map