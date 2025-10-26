import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { parseISO, formatISO } from "date-fns";

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  {{#collections}}
  collection(idOrName: "{{name}}"): RecordService<{{singularUpperCase}}>;
  {{/collections}}
}

export const pb = new PocketBase("http://127.0.0.1:8090") as TypedPockedBase;

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: pb.baseUrl }),
  endpoints: () => ({}),
  tagTypes: [
    {{#collections}}
    "{{name}}",
    {{/collections}}
  ],
});

{{#collections}}
export type {{singularUpperCase}} = {
  id: string;
  {{#fields}}
  {{&parsed}}
  {{/fields}}
  {{#includeExpand}}
  expand: {
    {{#expand}}
    {{name}}?: {{resolvedTo}}{{#isMultiple}}[]{{/isMultiple}};
    {{/expand}}
  };
  {{/includeExpand}}
};

export type Serialized{{singularUpperCase}} = {
  id: string;
  {{#fields}}
  {{&serialized}}
  {{/fields}}
  {{#includeExpand}}
  expand: {
    {{#expand}}
    {{name}}?: Serialized{{resolvedTo}}{{#isMultiple}}[]{{/isMultiple}};
    {{/expand}}
  };
  {{/includeExpand}}
};

export type Create{{singularUpperCase}} = {
  {{#fields}}
  {{#createParsed}}
  {{&createParsed}}
  {{/createParsed}}
  {{/fields}}
};

export type SerializedCreate{{singularUpperCase}} = {
  {{#fields}}
  {{#createSerialized}}
  {{&createSerialized}}
  {{/createSerialized}}
  {{/fields}}
};

export type Update{{singularUpperCase}} = {
  id: string;
  {{#fields}}
  {{#updateParsed}}
  {{&updateParsed}}
  {{/updateParsed}}
  {{/fields}}
};

export type SerializedUpdate{{singularUpperCase}} = {
  id: string;
  {{#fields}}
  {{#updateSerialized}}
  {{&updateSerialized}}
  {{/updateSerialized}}
  {{/fields}}
};

export type {{singularUpperCase}}Expand = {
  {{#expand}}
  {{name}}?: {{resolvedTo}}Expand;
  {{/expand}}
  {{^expand}}
  [key: string]: never;  
  {{/expand}}
};

export type {{singularUpperCase}}CommonOptions = {
  fields?: Array<"id"|{{#fields}}"{{name}}"|{{/fields}}"created"|"updated">;
};

export type {{singularUpperCase}}ListOptions = {{singularUpperCase}}CommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type {{singularUpperCase}}FullListOptions = {{singularUpperCase}}ListOptions & {
  expand?: {{singularUpperCase}}Expand;
  batch?: number;
};

export type {{singularUpperCase}}RecordOptions = {{singularUpperCase}}CommonOptions & {
  expand?: {{singularUpperCase}}Expand;
};

export type {{singularUpperCase}}RecordListOptions = unknown
  & {{singularUpperCase}}RecordOptions
  & {{singularUpperCase}}ListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type {{singularUpperCase}}RecordFullListOptions =
  & {{singularUpperCase}}FullListOptions
  & {{singularUpperCase}}RecordOptions
;

export function parse{{singularUpperCase}}(record: Serialized{{singularUpperCase}}): {{singularUpperCase}} {
  return {
    ...record,
    {{#fields}}
    {{#parser}}
    {{parser}}
    {{/parser}}
    {{/fields}}
    {{#includeExpand}}
    expand: record.expand && {
      {{#expand}}
      {{name}}: record.expand.{{name}}
        ? {{^isMultiple}}parse{{resolvedTo}}(record.expand.{{name}}){{/isMultiple}}{{#isMultiple}}record.expand.{{name}}.map(parse{{resolvedTo}}){{/isMultiple}}
        : undefined
      ,
      {{/expand}}
    },
    {{/includeExpand}}
  };
}

export function serialize{{singularUpperCase}}(record: {{singularUpperCase}}): Serialized{{singularUpperCase}} {
  return {
    ...record,
    {{#fields}}
    {{#serializer}}
    {{serializer}}
    {{/serializer}}
    {{/fields}}
    {{#includeExpand}}
    expand: record.expand && {
      {{#expand}}
      {{name}}: record.expand.{{name}}
        ? {{^isMultiple}}serialize{{resolvedTo}}(record.expand.{{name}}){{/isMultiple}}{{#isMultiple}}record.expand.{{name}}.map(serialize{{resolvedTo}}){{/isMultiple}}
        : undefined
      ,
      {{/expand}}
    },
    {{/includeExpand}}
  };
}

export function serializeCreate{{singularUpperCase}}(record: Create{{singularUpperCase}}): SerializedCreate{{singularUpperCase}} {
  return {
    ...record,
    {{#fields}}
    {{#createSerializer}}
    {{createSerializer}}
    {{/createSerializer}}
    {{/fields}}
  };
}

export function serializeUpdate{{singularUpperCase}}(record: Update{{singularUpperCase}}): SerializedUpdate{{singularUpperCase}} {
  return {
    ...record,
    {{#fields}}
    {{#updateSerializer}}
    {{updateSerializer}}
    {{/updateSerializer}}
    {{#isFile}}{{#isMultiple}}
    "{{name}}+": record.{{name}}Append,
    "+{{name}}": record.{{name}}Prepend,
    "{{name}}-": record.{{name}}Remove,
    {{/isMultiple}}{{/isFile}}
    {{/fields}}
  };
}

export const {{plural}}Api = api.injectEndpoints({
  endpoints: (build) => ({
    getOne{{singularUpperCase}}: build.query<{{singularUpperCase}}, string|({ id: string } & {{singularUpperCase}}RecordOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;

          const options = typeof args === "string" ? [] : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("{{name}}").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [{ type: "{{name}}", id: typeof args === "string" ? args : args.id }]
      ,
    }),

    getList{{pluralUpperCase}}: build.query<ListResult<{{singularUpperCase}}>, {{singularUpperCase}}RecordListOptions|void>({
      queryFn: async (args) => {
        try {
          const [page, perPage, options] = !args ? [] : [
            args.page,
            args.perPage,
            {
              ...args,
              expand: getExpandString(args.expand),
              fields: getFieldsString(args.fields),
            },
          ];

          const data = await pb.collection("{{name}}").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "{{name}}", id: "LIST-{{plural}}" },
          ...result.items.map((record) => ({ type: "{{name}}", id: record.id } as const)),
        ]
      ,
    }),

    getFullList{{pluralUpperCase}}: build.query<{{singularUpperCase}}[], {{singularUpperCase}}RecordFullListOptions|void>({
      queryFn: async (args) => {
        try {
          const options = !args ? undefined : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("{{name}}").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "{{name}}", id: "LIST-{{plural}}" },
          ...result.map((record) => ({ type: "{{name}}", id: record.id } as const)),
        ]
      ,
    }),

    create{{singularUpperCase}}: build.mutation<{{singularUpperCase}}, { record: Create{{singularUpperCase}} } & {{singularUpperCase}}RecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreate{{singularUpperCase}}(args.record);
          const data = await pb.collection("{{name}}").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
    }),

    update{{singularUpperCase}}: build.mutation<{{singularUpperCase}}, { record: Update{{singularUpperCase}} } & {{singularUpperCase}}RecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdate{{singularUpperCase}}(args.record);
          const data = await pb.collection("{{name}}").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "{{name}}", id: args.record.id },
      ],
    }),

    delete{{singularUpperCase}}: build.mutation<boolean, string|({ id: string } & {{singularUpperCase}}CommonOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;
          const options = typeof args === "string" ? undefined : {
            ...args,
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("{{name}}").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "{{name}}", id: typeof args === "string" ? args : args.id },
      ],
    }),
  }),
});

{{/collections}}
export type Expand = { [property: string]: Expand };

function getExpandString(expand?: Expand): string {
  if (!expand) {
    return "";
  }

  function getExpandStringInternal(prefix: string, expand: Expand): string[] {
    const withPrefix = prefix === ""
      ? ""
      : prefix + "."
    ;

    return Object.entries(expand)
      .map(([k, v]) => [
        withPrefix + k, 
        ...getExpandStringInternal((withPrefix + k), v),
      ])
      .flat()
    ;
  }

  return getExpandStringInternal("", expand).join(",");
}

export function getFieldsString(fields?: string[]): string|undefined {
  if (!fields) {
    return undefined;
  }

  return fields.join(",");
}
