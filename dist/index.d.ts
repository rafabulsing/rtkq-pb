export declare function schemaToTypes(collections: DbCollection[], options: ConfigOptions): string;
export declare function dbToTypes(dbPath: string, outputPath: string, configPath: string): void;
type RawDbCollection = {
    id: string;
    system: boolean;
    type: "base" | "auth";
    name: string;
    fields: string;
};
type DbCollection = Omit<RawDbCollection, "fields"> & {
    fields: UnknownDbField[];
    config: CollectionConfig;
};
type ConfigOptions = {
    inferRecordNames: boolean;
    importPocketbase?: string;
};
type CollectionConfig = {
    singular: string;
    plural: string;
};
type UnknownDbField = never | PlainTextDbField | RichTextDbField | NumberDbField | BooleanDbField | EmailDbField | UrlDbField | DateTimeDbField | AutoDateDbField | SelectDbField | FileDbField | RelationDbField | JsonDbField | GeoPointDbField | PasswordDbField;
type DbField = {
    hidden: boolean;
    id: string;
    name: string;
    presentable: boolean;
    system: boolean;
    type: string;
};
type PlainTextDbField = DbField & {
    type: "text";
    autogeneratePattern: string;
    max: number;
    min: number;
    pattern: string;
    primaryKey: boolean;
    required: boolean;
};
type RichTextDbField = DbField & {
    type: "editor";
    autogeneratePattern: string;
    maxSize: number;
    required: boolean;
};
type NumberDbField = DbField & {
    type: "number";
    max: number | null;
    min: number | null;
    onlyInt: boolean;
    required: boolean;
};
type BooleanDbField = DbField & {
    type: "bool";
    required: boolean;
};
type EmailDbField = DbField & {
    type: "email";
    required: boolean;
} & ({
    exceptDomains: string[];
    onlyDomains: null;
} | {
    exceptDomains: null;
    onlyDomains: string[];
} | {
    exceptDomains: null;
    onlyDomains: null;
});
type UrlDbField = DbField & {
    type: "url";
    required: boolean;
} & ({
    exceptDomains: string[];
    onlyDomains: null;
} | {
    exceptDomains: null;
    onlyDomains: string[];
} | {
    exceptDomains: null;
    onlyDomains: null;
});
type DateTimeDbField = DbField & {
    type: "date";
    max: string;
    min: string;
    required: boolean;
};
type AutoDateDbField = DbField & {
    type: "autodate";
} & ({
    onCreate: true;
    onUpdte: true;
} | {
    onCreate: true;
    onUpdate: false;
} | {
    onCreate: false;
    onUpdate: true;
});
type SelectDbField = DbField & {
    type: "select";
    maxSelect: number;
    values: string[];
    required: boolean;
};
type FileDbField = DbField & {
    type: "file";
    maxSelect: number;
    maxSize: number;
    mimeTypes: string[];
    protected: boolean;
    thumbs: string[];
    required: boolean;
};
type RelationDbField = DbField & {
    type: "relation";
    cascadeDelete: boolean;
    collectionId: string;
    maxSelect: number;
    minSelect: number;
    required: boolean;
};
type JsonDbField = DbField & {
    type: "json";
    maxSize: number;
    required: boolean;
};
type GeoPointDbField = DbField & {
    type: "geoPoint";
    required: boolean;
};
type PasswordDbField = DbField & {
    type: "password";
    cost: number;
    max: number;
    min: number;
    pattern: string;
    required: boolean;
};
export {};
//# sourceMappingURL=index.d.ts.map