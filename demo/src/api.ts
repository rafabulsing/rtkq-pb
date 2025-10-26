import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { parseISO, formatISO } from "date-fns";

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  collection(idOrName: "testRecords"): RecordService<TestRecord>;
}

export const pb = new PocketBase("http://127.0.0.1:8090") as TypedPockedBase;

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: pb.baseUrl }),
  endpoints: () => ({}),
  tagTypes: [
    "testRecords",
  ],
});

export type TestRecord = {
  id: string;
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: Date;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: string;
  thisIsMultipleFile: string[];
  thisIsAutoDate: Date;
  thisIsGeoPoint: { lat: number, lon: number };
  expand: {
    thisIsSingleRelation?: TestRecord;
    thisIsMultipleRelation?: TestRecord[];
  };
};

export type SerializedTestRecord = {
  id: string;
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: string;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: string;
  thisIsMultipleFile: string[];
  thisIsAutoDate: string;
  thisIsGeoPoint: { lat: number, lon: number };
  expand: {
    thisIsSingleRelation?: SerializedTestRecord;
    thisIsMultipleRelation?: SerializedTestRecord[];
  };
};

export type CreateTestRecord = {
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: Date;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: File;
  thisIsMultipleFile: File[];
  thisIsGeoPoint: { lat: number, lon: number };
};

export type SerializedCreateTestRecord = {
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: string;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: File|undefined|"";
  thisIsMultipleFile: File[]|undefined|[];
  thisIsGeoPoint: { lat: number, lon: number };
};

export type UpdateTestRecord = {
  id: string;
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: Date;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: File;
  thisIsMultipleFile: File[];
  thisIsMultipleFileAppend?: File[];
  thisIsMultipleFilePrepend?: File[];
  thisIsMultipleFileRemove?: string[];
  thisIsGeoPoint: { lat: number, lon: number };
};

export type SerializedUpdateTestRecord = {
  id: string;
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsNumber: number;
  thisIsSingleRelation: string;
  thisIsMultipleRelation: string[];
  thisIsDateTime: string;
  thisIsBoolean: boolean;
  thisIsJson: unknown;
  thisIsSingleSelect: "somebody"|"once"|"told"|"me";
  thisIsMultipleSelect: Array<"the"|"world"|"is"|"gonna"|"roll"|"me">;
  thisIsSingleFile: File|undefined|"";
  thisIsMultipleFile: File[]|undefined|[];
  "thisIsMultipleFile+"?: File[];
  "+thisIsMultipleFile"?: File[];
  "thisIsMultipleFile-"?: string[];
  thisIsGeoPoint: { lat: number, lon: number };
};

export type TestRecordExpand = {
  thisIsSingleRelation?: TestRecordExpand;
  thisIsMultipleRelation?: TestRecordExpand;
};

export type TestRecordCommonOptions = {
  fields?: Array<"id"|"thisIsPlainText"|"thisIsRichText"|"thisIsEmail"|"thisIsUrl"|"thisIsNumber"|"thisIsSingleRelation"|"thisIsMultipleRelation"|"thisIsDateTime"|"thisIsBoolean"|"thisIsJson"|"thisIsSingleSelect"|"thisIsMultipleSelect"|"thisIsSingleFile"|"thisIsMultipleFile"|"thisIsAutoDate"|"thisIsGeoPoint"|"created"|"updated">;
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
    thisIsDateTime: parseISO(record.thisIsDateTime),
    thisIsAutoDate: parseISO(record.thisIsAutoDate),
    expand: record.expand && {
      thisIsSingleRelation: record.expand.thisIsSingleRelation
        ? parseTestRecord(record.expand.thisIsSingleRelation)
        : undefined
      ,
      thisIsMultipleRelation: record.expand.thisIsMultipleRelation
        ? record.expand.thisIsMultipleRelation.map(parseTestRecord)
        : undefined
      ,
    },
  };
}

export function serializeTestRecord(record: TestRecord): SerializedTestRecord {
  return {
    ...record,
    thisIsDateTime: formatISO(record.thisIsDateTime),
    thisIsAutoDate: formatISO(record.thisIsAutoDate),
    expand: record.expand && {
      thisIsSingleRelation: record.expand.thisIsSingleRelation
        ? serializeTestRecord(record.expand.thisIsSingleRelation)
        : undefined
      ,
      thisIsMultipleRelation: record.expand.thisIsMultipleRelation
        ? record.expand.thisIsMultipleRelation.map(serializeTestRecord)
        : undefined
      ,
    },
  };
}

export function serializeCreateTestRecord(record: CreateTestRecord): SerializedCreateTestRecord {
  return {
    ...record,
    thisIsDateTime: formatISO(record.thisIsDateTime),
  };
}

export function serializeUpdateTestRecord(record: UpdateTestRecord): SerializedUpdateTestRecord {
  return {
    ...record,
    thisIsDateTime: formatISO(record.thisIsDateTime),
    "thisIsMultipleFile+": record.thisIsMultipleFileAppend,
    "+thisIsMultipleFile": record.thisIsMultipleFilePrepend,
    "thisIsMultipleFile-": record.thisIsMultipleFileRemove,
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

          const data = await pb.collection("testRecords").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [{ type: "testRecords", id: typeof args === "string" ? args : args.id }]
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

          const data = await pb.collection("testRecords").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "testRecords", id: "LIST-testRecords" },
          ...result.items.map((record) => ({ type: "testRecords", id: record.id } as const)),
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

          const data = await pb.collection("testRecords").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "testRecords", id: "LIST-testRecords" },
          ...result.map((record) => ({ type: "testRecords", id: record.id } as const)),
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
          const data = await pb.collection("testRecords").create(serializedRecord, options);
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
          const data = await pb.collection("testRecords").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "testRecords", id: args.record.id },
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
          const data = await pb.collection("testRecords").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "testRecords", id: typeof args === "string" ? args : args.id },
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
