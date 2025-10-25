import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { parseISO, formatISO } from "date-fns";

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  collection(idOrName: "drivers"): RecordService<Driver>;
  collection(idOrName: "cnhs"): RecordService<Cnh>;
  collection(idOrName: "testCollection"): RecordService<TestRecord>;
}

export const pb = new PocketBase("http://127.0.0.1:8090") as TypedPockedBase;

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: pb.baseUrl }),
  endpoints: () => ({}),
  tagTypes: [
    "drivers",
    "cnhs",
    "testCollection",
  ],
});

export type Driver = {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  deleted: Date;
  created: Date;
  updated: Date;
};

export type SerializedDriver = {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  deleted: string;
  created: string;
  updated: string;
};

export type CreateDriver = {
  fullName: string;
  email: string;
  avatar: File;
  deleted: Date;
};

export type SerializedCreateDriver = {
  fullName: string;
  email: string;
  avatar: File;
  deleted: string;
};

export type UpdateDriver = {
  id: string;
  fullName: string;
  email: string;
  avatar?: File|undefined|"";
  deleted: Date;
};

export type SerializedUpdateDriver = {
  id: string;
  fullName: string;
  email: string;
  avatar?: File|undefined|"";
  deleted: string;
};

export type DriverExpand = {
  [key: string]: never;  
};

export type DriverCommonOptions = {
  fields?: Array<"id"|"fullName"|"email"|"avatar"|"deleted"|"created"|"updated"|"created"|"updated">;
};

export type DriverListOptions = DriverCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type DriverFullListOptions = DriverListOptions & {
  expand?: DriverExpand;
  batch?: number;
};

export type DriverRecordOptions = DriverCommonOptions & {
  expand?: DriverExpand;
};

export type DriverRecordListOptions = unknown
  & DriverRecordOptions
  & DriverListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type DriverRecordFullListOptions =
  & DriverFullListOptions
  & DriverRecordOptions
;

export function parseDriver(record: SerializedDriver): Driver {
  return {
    ...record,
    deleted: parseISO(record.deleted),
    created: parseISO(record.created),
    updated: parseISO(record.updated),
  };
}

export function serializeDriver(record: Driver): SerializedDriver {
  return {
    ...record,
    deleted: formatISO(record.deleted),
    created: formatISO(record.created),
    updated: formatISO(record.updated),
  };
}

export function serializeCreateDriver(record: CreateDriver): SerializedCreateDriver {
  return {
    ...record,
    deleted: formatISO(record.deleted),
  };
}

export function serializeUpdateDriver(record: UpdateDriver): SerializedUpdateDriver {
  return {
    ...record,
    deleted: formatISO(record.deleted),
  };
}

export const driversApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOneDriver: build.query<Driver, string|({ id: string } & DriverRecordOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;

          const options = typeof args === "string" ? [] : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("drivers").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [{ type: "drivers", id: typeof args === "string" ? args : args.id }]
      ,
    }),

    getListDrivers: build.query<ListResult<Driver>, DriverRecordListOptions|void>({
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

          const data = await pb.collection("drivers").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "drivers", id: "LIST-drivers" },
          ...result.items.map((record) => ({ type: "drivers", id: record.id } as const)),
        ]
      ,
    }),

    getFullListDrivers: build.query<Driver[], DriverRecordFullListOptions|void>({
      queryFn: async (args) => {
        try {
          const options = !args ? undefined : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("drivers").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "drivers", id: "LIST-drivers" },
          ...result.map((record) => ({ type: "drivers", id: record.id } as const)),
        ]
      ,
    }),

    createDriver: build.mutation<Driver, { record: CreateDriver } & DriverRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateDriver(args.record);
          const data = await pb.collection("drivers").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
    }),

    updateDriver: build.mutation<Driver, { record: UpdateDriver } & DriverRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateDriver(args.record);
          const data = await pb.collection("drivers").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "drivers", id: args.record.id },
      ],
    }),

    deleteDriver: build.mutation<boolean, string|({ id: string } & DriverCommonOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;
          const options = typeof args === "string" ? undefined : {
            ...args,
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("drivers").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "drivers", id: typeof args === "string" ? args : args.id },
      ],
    }),
  }),
});

export type Cnh = {
  id: string;
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
  created: Date;
  updated: Date;
  expand: {
    driver?: Driver[];
  };
};

export type SerializedCnh = {
  id: string;
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
  created: string;
  updated: string;
  expand: {
    driver?: SerializedDriver[];
  };
};

export type CreateCnh = {
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
};

export type SerializedCreateCnh = {
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
};

export type UpdateCnh = {
  id: string;
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
};

export type SerializedUpdateCnh = {
  id: string;
  driver: string[];
  number: string;
  categories: Array<"acc"|"a"|"b"|"c"|"d"|"e">;
};

export type CnhExpand = {
  driver?: DriverExpand;
};

export type CnhCommonOptions = {
  fields?: Array<"id"|"driver"|"number"|"categories"|"created"|"updated"|"created"|"updated">;
};

export type CnhListOptions = CnhCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type CnhFullListOptions = CnhListOptions & {
  expand?: CnhExpand;
  batch?: number;
};

export type CnhRecordOptions = CnhCommonOptions & {
  expand?: CnhExpand;
};

export type CnhRecordListOptions = unknown
  & CnhRecordOptions
  & CnhListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type CnhRecordFullListOptions =
  & CnhFullListOptions
  & CnhRecordOptions
;

export function parseCnh(record: SerializedCnh): Cnh {
  return {
    ...record,
    created: parseISO(record.created),
    updated: parseISO(record.updated),
    expand: record.expand && {
      driver: record.expand.driver
        ? record.expand.driver.map(parseDriver)
        : undefined
      ,
    },
  };
}

export function serializeCnh(record: Cnh): SerializedCnh {
  return {
    ...record,
    created: formatISO(record.created),
    updated: formatISO(record.updated),
    expand: record.expand && {
      driver: record.expand.driver
        ? record.expand.driver.map(serializeDriver)
        : undefined
      ,
    },
  };
}

export function serializeCreateCnh(record: CreateCnh): SerializedCreateCnh {
  return {
    ...record,
  };
}

export function serializeUpdateCnh(record: UpdateCnh): SerializedUpdateCnh {
  return {
    ...record,
  };
}

export const cnhsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOneCnh: build.query<Cnh, string|({ id: string } & CnhRecordOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;

          const options = typeof args === "string" ? [] : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("cnhs").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [{ type: "cnhs", id: typeof args === "string" ? args : args.id }]
      ,
    }),

    getListCnhs: build.query<ListResult<Cnh>, CnhRecordListOptions|void>({
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

          const data = await pb.collection("cnhs").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "cnhs", id: "LIST-cnhs" },
          ...result.items.map((record) => ({ type: "cnhs", id: record.id } as const)),
        ]
      ,
    }),

    getFullListCnhs: build.query<Cnh[], CnhRecordFullListOptions|void>({
      queryFn: async (args) => {
        try {
          const options = !args ? undefined : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("cnhs").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "cnhs", id: "LIST-cnhs" },
          ...result.map((record) => ({ type: "cnhs", id: record.id } as const)),
        ]
      ,
    }),

    createCnh: build.mutation<Cnh, { record: CreateCnh } & CnhRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateCnh(args.record);
          const data = await pb.collection("cnhs").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
    }),

    updateCnh: build.mutation<Cnh, { record: UpdateCnh } & CnhRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateCnh(args.record);
          const data = await pb.collection("cnhs").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "cnhs", id: args.record.id },
      ],
    }),

    deleteCnh: build.mutation<boolean, string|({ id: string } & CnhCommonOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;
          const options = typeof args === "string" ? undefined : {
            ...args,
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("cnhs").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "cnhs", id: typeof args === "string" ? args : args.id },
      ],
    }),
  }),
});

export type TestRecord = {
  id: string;
  testGeo: { lat: number, lon: number };
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedTestRecord = {
  id: string;
  testGeo: { lat: number, lon: number };
  createdAt: string;
  updatedAt: string;
};

export type CreateTestRecord = {
  testGeo: { lat: number, lon: number };
};

export type SerializedCreateTestRecord = {
  testGeo: { lat: number, lon: number };
};

export type UpdateTestRecord = {
  id: string;
  testGeo: { lat: number, lon: number };
};

export type SerializedUpdateTestRecord = {
  id: string;
  testGeo: { lat: number, lon: number };
};

export type TestRecordExpand = {
  [key: string]: never;  
};

export type TestRecordCommonOptions = {
  fields?: Array<"id"|"testGeo"|"createdAt"|"updatedAt"|"created"|"updated">;
};

export type TestRecordListOptions = TestRecordCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type TestRecordFullListOptions = TestRecordListOptions & {
  expand?: TestRecordExpand;
  batch?: number;
};

export type TestRecordRecordOptions = TestRecordCommonOptions & {
  expand?: TestRecordExpand;
};

export type TestRecordRecordListOptions = unknown
  & TestRecordRecordOptions
  & TestRecordListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type TestRecordRecordFullListOptions =
  & TestRecordFullListOptions
  & TestRecordRecordOptions
;

export function parseTestRecord(record: SerializedTestRecord): TestRecord {
  return {
    ...record,
    createdAt: parseISO(record.createdAt),
    updatedAt: parseISO(record.updatedAt),
  };
}

export function serializeTestRecord(record: TestRecord): SerializedTestRecord {
  return {
    ...record,
    createdAt: formatISO(record.createdAt),
    updatedAt: formatISO(record.updatedAt),
  };
}

export function serializeCreateTestRecord(record: CreateTestRecord): SerializedCreateTestRecord {
  return {
    ...record,
  };
}

export function serializeUpdateTestRecord(record: UpdateTestRecord): SerializedUpdateTestRecord {
  return {
    ...record,
  };
}

export const testRecordsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOneTestRecord: build.query<TestRecord, string|({ id: string } & TestRecordRecordOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;

          const options = typeof args === "string" ? [] : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("testCollection").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [{ type: "testCollection", id: typeof args === "string" ? args : args.id }]
      ,
    }),

    getListTestRecords: build.query<ListResult<TestRecord>, TestRecordRecordListOptions|void>({
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

          const data = await pb.collection("testCollection").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "testCollection", id: "LIST-testRecords" },
          ...result.items.map((record) => ({ type: "testCollection", id: record.id } as const)),
        ]
      ,
    }),

    getFullListTestRecords: build.query<TestRecord[], TestRecordRecordFullListOptions|void>({
      queryFn: async (args) => {
        try {
          const options = !args ? undefined : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("testCollection").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "testCollection", id: "LIST-testRecords" },
          ...result.map((record) => ({ type: "testCollection", id: record.id } as const)),
        ]
      ,
    }),

    createTestRecord: build.mutation<TestRecord, { record: CreateTestRecord } & TestRecordRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateTestRecord(args.record);
          const data = await pb.collection("testCollection").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
    }),

    updateTestRecord: build.mutation<TestRecord, { record: UpdateTestRecord } & TestRecordRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateTestRecord(args.record);
          const data = await pb.collection("testCollection").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "testCollection", id: args.record.id },
      ],
    }),

    deleteTestRecord: build.mutation<boolean, string|({ id: string } & TestRecordCommonOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;
          const options = typeof args === "string" ? undefined : {
            ...args,
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("testCollection").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "testCollection", id: typeof args === "string" ? args : args.id },
      ],
    }),
  }),
});

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
