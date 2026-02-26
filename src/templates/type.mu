/* eslint-disable */

import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
{{#options.importPocketbase}}
{{{.}}}
{{/options.importPocketbase}}
{{^options.importPocketbase}}

export const pb = new PocketBase("http://127.0.0.1:8090") as TypedPockedBase;
{{/options.importPocketbase}}

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  {{#collections}}
  collection(idOrName: "{{name}}"): RecordService<{{singularUpperCase}}>;
  {{/collections}}
}

type _TagType = never
  {{#collections}}
  | "{{name}}"
  {{/collections}}
;

type _Tag = { type: _TagType; id: string };

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Email = Flavor<string, "Email">;
type RichText = Flavor<string, "RichText">;
type Url = Flavor<string, "Url">;
type Relation = Flavor<string, "Relation">;

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
  collectionId: string;
  collectionName: "{{name}}";
  {{#fields}}
  {{#tsDoc}}
  {{&.}}
  {{/tsDoc}}
  {{&printed}}
  {{/fields}}
  {{#isAuthCollection}}
  email: string,
  emailVisibility: boolean,
  verified: boolean,
  {{/isAuthCollection}}
  {{#includeExpand}}
  expand: {
    {{#expand}}
    {{name}}?: {{singularUpperCase}}{{#isMultiple}}[]{{/isMultiple}};
    {{/expand}}
  };
  {{/includeExpand}}
};

export type Create{{singularUpperCase}} = {
  {{#fields}}
  {{#createPrinted}}
  {{#tsDoc}}
  {{&.}}
  {{/tsDoc}}
  {{&createPrinted}}
  {{/createPrinted}}
  {{/fields}}
  {{#isAuthCollection}}
  email: string,
  emailVisibility?: boolean,
  verified?: boolean,
  password: string,
  passwordConfirm: string,
  {{/isAuthCollection}}
};

export type Update{{singularUpperCase}} = {
  id: string;
  {{#fields}}
  {{#updatePrinted}}
  {{#tsDoc}}
  {{&.}}
  {{/tsDoc}}
  {{&updatePrinted}}
  {{/updatePrinted}}
  {{/fields}}
  {{^isAuthCollection}}
};
  {{/isAuthCollection}}
  {{#isAuthCollection}}
  email?: string,
  emailVisibility?: boolean,
  verified?: boolean,
} & (
  {
    oldPassword: string,
    password: string,
    passwordConfirm: string,
  } | {
    oldPassword: undefined,
    password: undefined,
    passwordConfirm: undefined,
  }
);
{{/isAuthCollection}}

export type {{singularUpperCase}}Expand = {
  {{#expand}}
  {{name}}?: {{singularUpperCase}}Expand;
  {{/expand}}
  {{^expand}}
  [key: string]: never;  
  {{/expand}}
};

export type Resolved{{singularUpperCase}}Expand<T extends {{singularUpperCase}}Expand> = {
  {{#expand}}
  {{name}}{{^isRequired}}?{{/isRequired}}: undefined extends T["{{name}}"]
    ? never
    : {{#isMultiple}}({{singularUpperCase}} & { expand: Resolved{{singularUpperCase}}Expand<NonNullable<T["{{name}}"]>> })[]{{/isMultiple}}{{^isMultiple}}{{singularUpperCase}} & { expand: Resolved{{singularUpperCase}}Expand<NonNullable<T["{{name}}"]>> }{{/isMultiple}}
  ;
  {{/expand}}
  {{^expand}}
  [key: string]: never;  
  {{/expand}}
};

export type {{singularUpperCase}}CommonOptions = {
  fields?: Array<"id"|{{#fields}}"{{name}}"|{{/fields}}"created"|"updated">;
  tags?: Array<{ type: _TagType, id?: string }>;
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

function getTagsFor{{singularUpperCase}}(record: {{singularUpperCase}}): _Tag[] {
  return ([
    { type: "{{name}}", id: record.id },
    {{#expand}}
    {{#isMultiple}}
    record.expand?.{{name}} && { type: "{{resolvedToCollection}}", id: `LIST-{{collection}}-${record.id}` } as const,
    ...(record.expand?.{{name}} ?? []).map((e) => getTagsFor{{singularUpperCase}}(e)).flat(),
    {{/isMultiple}}
    {{^isMultiple}}
    ...(!record.expand?.{{name}} ? [] : getTagsFor{{singularUpperCase}}(record.expand.{{name}})),
    {{/isMultiple}}
    {{/expand}}
  ] as const).filter((t) => !!t);
}

export const {{plural}}ApiInternal = api.injectEndpoints({
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
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      providesTags: (result, error, args) => !result
        ? ["{{name}}", ...((typeof args === "object" && args.tags) || [])]
        : [...getTagsFor{{singularUpperCase}}(result), ...((typeof args === "object" && args.tags) || [])]
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
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      providesTags: (result, error, args) => !result
        ? ["{{name}}", ...(args?.tags ?? [])]
        : [
          { type: "{{name}}", id: "LIST-{{plural}}" },
          ...result.items.map((record) => getTagsFor{{singularUpperCase}}(record)).flat(),
          ...(args?.tags ?? [])
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
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      providesTags: (result, error, args) => !result
        ? ["{{name}}", ...(args?.tags ?? [])]
        : [
          { type: "{{name}}", id: "LIST-{{plural}}" },
          ...result.map((record) => getTagsFor{{singularUpperCase}}(record)).flat(),
          ...(args?.tags ?? [])
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
          const data = await pb.collection("{{name}}").create(args.record, options);
          return { data };
        } catch (error: any) {
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      invalidatesTags: (result, error, args) => !result
        ? ["{{name}}", ...(args.tags ?? [])]
        : [{ type: "{{name}}", id: "LIST-{{plural}}" }, ...(args.tags ?? [])]
      ,
    }),

    update{{singularUpperCase}}: build.mutation<{{singularUpperCase}}, { record: Update{{singularUpperCase}} } & {{singularUpperCase}}RecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("{{name}}").update(args.record.id, args.record, options);
          return { data };
        } catch (error: any) {
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "{{name}}", id: args.record.id },
        ...(args.tags ?? [])
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
          return { error: JSON.parse(JSON.stringify(error)) };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "{{name}}", id: typeof args === "string" ? args : args.id },
        ...((typeof args === "object" && args.tags) || [])
      ],
    }),
  }),
});

export const {{plural}}Api = {
  ...{{plural}}ApiInternal,
  useGetOne{{singularUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    args: Parameters<typeof {{plural}}ApiInternal.useGetOne{{singularUpperCase}}Query>[0] & { expand?: T },
    options?: Parameters<typeof {{plural}}ApiInternal.useGetOne{{singularUpperCase}}Query>[1],
  ) {
    return {{plural}}ApiInternal.useGetOne{{singularUpperCase}}Query(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as {{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        },
        currentData: result.currentData as {{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        },
      }),
    });
  },

  useLazyGetOne{{singularUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    options?: Parameters<typeof {{plural}}ApiInternal.useLazyGetOne{{singularUpperCase}}Query>[0],
  ) {
    return {{plural}}ApiInternal.useLazyGetOne{{singularUpperCase}}Query({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as {{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        },
        currentData: result.currentData as {{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        },
      }),
    });
  },

  useGetList{{pluralUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    args: Parameters<typeof {{plural}}ApiInternal.useGetList{{pluralUpperCase}}Query>[0] & { expand?: T },
    options?: Parameters<typeof {{plural}}ApiInternal.useGetList{{pluralUpperCase}}Query>[1],
  ) {
    return {{plural}}ApiInternal.useGetList{{pluralUpperCase}}Query(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as ListResult<{{singularUpperCase}}> & {
          items: Array<{{singularUpperCase}} & {
            expand: Resolved{{singularUpperCase}}Expand<T>,
          }>,
        },
        currentData: result.currentData as ListResult<{{singularUpperCase}}> & {
          items: Array<{{singularUpperCase}} & {
            expand: Resolved{{singularUpperCase}}Expand<T>,
          }>,
        },
      }),
    });
  },

  useLazyGetList{{pluralUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    options?: Parameters<typeof {{plural}}ApiInternal.useLazyGetList{{pluralUpperCase}}Query>[0],
  ) {
    return {{plural}}ApiInternal.useLazyGetList{{pluralUpperCase}}Query({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as ListResult<{{singularUpperCase}}> & {
          items: Array<{{singularUpperCase}} & {
            expand: Resolved{{singularUpperCase}}Expand<T>,
          }>,
        },
        currentData: result.currentData as ListResult<{{singularUpperCase}}> & {
          items: Array<{{singularUpperCase}} & {
            expand: Resolved{{singularUpperCase}}Expand<T>,
          }>,
        },
      }),
    });
  },

  useGetFullList{{pluralUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    args?: Parameters<typeof {{plural}}ApiInternal.useGetFullList{{pluralUpperCase}}Query>[0] & { expand?: T },
    options?: Parameters<typeof {{plural}}ApiInternal.useGetFullList{{pluralUpperCase}}Query>[1],
  ) {
    return {{plural}}ApiInternal.useGetFullList{{pluralUpperCase}}Query(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as Array<{{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        }>,
        currentData: result.currentData as Array<{{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        }>,
      }),
    });
  },

  useLazyGetFullList{{pluralUpperCase}}Query: function<T extends {{singularUpperCase}}Expand>(
    options?: Parameters<typeof {{plural}}ApiInternal.useLazyGetFullList{{pluralUpperCase}}Query>[0],
  ) {
    return {{plural}}ApiInternal.useLazyGetFullList{{pluralUpperCase}}Query({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as Array<{{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        }>,
        currentData: result.currentData as Array<{{singularUpperCase}} & {
          expand: Resolved{{singularUpperCase}}Expand<T>,
        }>,
      }),
    });
  },

  useCreate{{singularUpperCase}}Mutation: function<T extends {{singularUpperCase}}Expand>(
    options?: Parameters<typeof {{plural}}ApiInternal.useCreate{{singularUpperCase}}Mutation>[0],
  ) {
    return {{plural}}ApiInternal.useCreate{{singularUpperCase}}Mutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as {{singularUpperCase}},
      }),
    });
  },

  useUpdate{{singularUpperCase}}Mutation: function<T extends {{singularUpperCase}}Expand>(
    options?: Parameters<typeof {{plural}}ApiInternal.useUpdate{{singularUpperCase}}Mutation>[0],
  ) {
    return {{plural}}ApiInternal.useUpdate{{singularUpperCase}}Mutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data as {{singularUpperCase}},
      }),
    });
  },
};

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

type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
