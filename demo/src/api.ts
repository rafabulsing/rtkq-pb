import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { parseISO, formatISO } from "date-fns";

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  collection(idOrName: "users"): RecordService<SerializedUser>;
  collection(idOrName: "testCollection"): RecordService<SerializedTestRecord>;
}

type TagType = never
  | "users"
  | "testCollection"
;

type Tag = { type: TagType; id: string };

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Email = Flavor<string, "Email">;
type RichText = Flavor<string, "RichText">;
type Url = Flavor<string, "Url">;
type Relation = Flavor<string, "Relation">;

export const pb = new PocketBase("http://127.0.0.1:8090") as TypedPockedBase;

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: pb.baseUrl }),
  endpoints: () => ({}),
  tagTypes: [
    "users",
    "testCollection",
  ],
});

export type User = {
  id: string;
  name: string;
  avatar: string;
  created: Date;
  updated: Date;
  email: Email,
  emailVisibility: boolean,
  verified: boolean,
};

export type SerializedUser = {
  id: string;
  name: string;
  avatar: string;
  created: string;
  updated: string;
  email: string,
  emailVisibility: boolean,
  verified: boolean,
};

export type CreateUser = {
  name: string;
  avatar: File;
  email: Email,
  emailVisibility?: boolean,
  verified?: boolean,
  password: string,
  passwordConfirm: string,
};

export type SerializedCreateUser = {
  name: string;
  avatar: File|undefined|"";
  email: string,
  emailVisibility?: boolean,
  verified?: boolean,
  password: string,
  passwordConfirm: string,
};

export type UpdateUser = {
  id: string;
  name?: string;
  avatar?: File;
  email?: Email,
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

export type SerializedUpdateUser = {
  id: string;
  name?: string;
  avatar?: File|undefined|"";
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

export type UserExpand = {
  [key: string]: never;  
};

export type ResolvedUserExpand<T extends UserExpand> = {
  [key: string]: never;  
};

export type UserCommonOptions = {
  fields?: Array<"id"|"name"|"avatar"|"created"|"updated"|"created"|"updated">;
};

export type UserListOptions = UserCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type UserFullListOptions = UserListOptions & {
  expand?: UserExpand;
  batch?: number;
};

export type UserRecordOptions = UserCommonOptions & {
  expand?: UserExpand;
};

export type UserRecordListOptions = unknown
  & UserRecordOptions
  & UserListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type UserRecordFullListOptions =
  & UserFullListOptions
  & UserRecordOptions
;

export function parseUser(record: SerializedUser): User {
  return {
    ...record,
    created: parseISO(record.created),
    updated: parseISO(record.updated),
  };
}

export function serializeUser(record: User): SerializedUser {
  return {
    ...record,
    created: formatISO(record.created),
    updated: formatISO(record.updated),
  };
}

export function serializeCreateUser(record: CreateUser): SerializedCreateUser {
  return {
    ...record,
  };
}

export function serializeUpdateUser(record: UpdateUser): SerializedUpdateUser {
  return {
    ...record,
  };
}

function getTagsForUser(record: SerializedUser): Tag[] {
  return ([
    { type: "users", id: record.id },
  ] as const).filter((t) => !!t);
}

export const usersApiInternal = api.injectEndpoints({
  endpoints: (build) => ({
    getOneUser: build.query<SerializedUser, string|({ id: string } & UserRecordOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;

          const options = typeof args === "string" ? [] : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("users").getOne(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : getTagsForUser(result)
      ,
    }),

    getListUsers: build.query<ListResult<SerializedUser>, UserRecordListOptions|void>({
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

          const data = await pb.collection("users").getList(page, perPage, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "users", id: "LIST-users" },
          ...result.items.map((record) => getTagsForUser(record)).flat(),
        ]
      ,
    }),

    getFullListUsers: build.query<SerializedUser[], UserRecordFullListOptions|void>({
      queryFn: async (args) => {
        try {
          const options = !args ? undefined : {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };

          const data = await pb.collection("users").getFullList(options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      providesTags: (result, error, args) => !result
        ? []
        : [
          { type: "users", id: "LIST-users" },
          ...result.map((record) => getTagsForUser(record)).flat(),
        ]
      ,
    }),

    createUser: build.mutation<SerializedUser, { record: CreateUser } & UserRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateUser(args.record);
          const data = await pb.collection("users").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => !result
        ? []
        : [{ type: "users", id: "LIST-users" }]
      ,
    }),

    updateUser: build.mutation<SerializedUser, { record: UpdateUser } & UserRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateUser(args.record);
          const data = await pb.collection("users").update(args.record.id, serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "users", id: args.record.id },
      ],
    }),

    deleteUser: build.mutation<boolean, string|({ id: string } & UserCommonOptions)>({
      queryFn: async (args) => {
        try {
          const id = typeof args === "string" ? args : args.id;
          const options = typeof args === "string" ? undefined : {
            ...args,
            fields: getFieldsString(args.fields),
          };
          const data = await pb.collection("users").delete(id, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "users", id: typeof args === "string" ? args : args.id },
      ],
    }),
  }),
});

export const usersApi = {
  ...usersApiInternal,
  useGetOneUserQuery: function<T extends UserExpand>(
    args: Parameters<typeof usersApiInternal.useGetOneUserQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetOneUserQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetOneUserQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUser(result.data) as User & {
          expand: ResolvedUserExpand<T>,
        },
        currentData: result.currentData && parseUser(result.currentData) as User & {
          expand: ResolvedUserExpand<T>,
        },
      }),
    });
  },

  useLazyGetOneUserQuery: function<T extends UserExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetOneUserQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetOneUserQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUser(result.data) as User & {
          expand: ResolvedUserExpand<T>,
        },
        currentData: result.currentData && parseUser(result.currentData) as User & {
          expand: ResolvedUserExpand<T>,
        },
      }),
    });
  },

  useGetListUsersQuery: function<T extends UserExpand>(
    args: Parameters<typeof usersApiInternal.useGetListUsersQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetListUsersQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetListUsersQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseUser) as Array<User & {
            expand: ResolvedUserExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseUser) as Array<User & {
            expand: ResolvedUserExpand<T>,
          }>,
        },
      }),
    });
  },

  useLazyGetListUsersQuery: function<T extends UserExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetListUsersQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetListUsersQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseUser) as Array<User & {
            expand: ResolvedUserExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseUser) as Array<User & {
            expand: ResolvedUserExpand<T>,
          }>,
        },
      }),
    });
  },

  useGetFullListUsersQuery: function<T extends UserExpand>(
    args: Parameters<typeof usersApiInternal.useGetFullListUsersQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetFullListUsersQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetFullListUsersQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseUser) as Array<User & {
          expand: ResolvedUserExpand<T>,
        }>,
        currentData: result.currentData?.map(parseUser) as Array<User & {
          expand: ResolvedUserExpand<T>,
        }>,
      }),
    });
  },

  useLazyGetFullListUsersQuery: function<T extends UserExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetFullListUsersQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetFullListUsersQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseUser) as Array<User & {
          expand: ResolvedUserExpand<T>,
        }>,
        currentData: result.currentData?.map(parseUser) as Array<User & {
          expand: ResolvedUserExpand<T>,
        }>,
      }),
    });
  },

  useCreateUserMutation: function<T extends UserExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useCreateUserMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useCreateUserMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUser(result.data) as User,
      }),
    });
  },

  useUpdateUserMutation: function<T extends UserExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useUpdateUserMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useUpdateUserMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUser(result.data) as User,
      }),
    });
  },
};

export type TestRecord = {
  id: string;
  /** Must not be empty string. **/
  thisIsPlainText: string;
  thisIsRichText: RichText|null;
  thisIsNumber: number;
  thisIsBoolean: boolean;
  thisIsEmail: Email|null;
  thisIsUrl: Url|null;
  thisIsDateTime: Date|null;
  thisIsAutoDate: Date;
  thisIsSelect: "somebody"|"once"|"told"|"me";
  thisIsFile: string;
  thisIsMultipleFile: string[];
  thisIsRelation: Relation|null;
  thisIsMultipleRelation: Relation[]|null;
  thisIsJson: unknown;
  thisIsGeoPoint: { lat: number, lon: number };
  expand: {
    thisIsRelation?: User;
    thisIsMultipleRelation?: TestRecord[];
  };
};

export type SerializedTestRecord = {
  id: string;
  /** Must not be empty string. **/
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsNumber: number;
  thisIsBoolean: boolean;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsDateTime: string;
  thisIsAutoDate: string;
  thisIsSelect: "somebody"|"once"|"told"|"me";
  thisIsFile: string;
  thisIsMultipleFile: string[];
  thisIsRelation: string;
  thisIsMultipleRelation: string[];
  thisIsJson: unknown;
  thisIsGeoPoint: { lat: number, lon: number };
  expand: {
    thisIsRelation?: SerializedUser;
    thisIsMultipleRelation?: SerializedTestRecord[];
  };
};

export type CreateTestRecord = {
  /** Must not be empty string. **/
  thisIsPlainText: string;
  thisIsRichText: RichText|null;
  thisIsNumber: number;
  thisIsBoolean: boolean;
  thisIsEmail: Email|null;
  thisIsUrl: Url|null;
  thisIsDateTime: Date|null;
  thisIsSelect: "somebody"|"once"|"told"|"me";
  thisIsFile: File;
  thisIsMultipleFile: File[];
  thisIsRelation: Relation|null;
  thisIsMultipleRelation: Relation[]|null;
  thisIsJson: unknown;
  thisIsGeoPoint: { lat: number, lon: number };
};

export type SerializedCreateTestRecord = {
  /** Must not be empty string. **/
  thisIsPlainText: string;
  thisIsRichText: string;
  thisIsNumber: number;
  thisIsBoolean: boolean;
  thisIsEmail: string;
  thisIsUrl: string;
  thisIsDateTime: string;
  thisIsSelect: "somebody"|"once"|"told"|"me";
  thisIsFile: File|undefined|"";
  thisIsMultipleFile: File[]|undefined|[];
  thisIsRelation: string;
  thisIsMultipleRelation: string[];
  thisIsJson: unknown;
  thisIsGeoPoint: { lat: number, lon: number };
};

export type UpdateTestRecord = {
  id: string;
  /** Must not be empty string. **/
  thisIsPlainText?: string;
  thisIsRichText?: RichText|null;
  thisIsNumber?: number;
  thisIsBoolean?: boolean;
  thisIsEmail?: Email|null;
  thisIsUrl?: Url|null;
  thisIsDateTime?: Date|null;
  thisIsSelect?: "somebody"|"once"|"told"|"me";
  thisIsFile?: File;
  thisIsMultipleFile?: File[];
  thisIsMultipleFileAppend?: File[];
  thisIsMultipleFilePrepend?: File[];
  thisIsMultipleFileRemove?: string[];
  thisIsRelation?: Relation|null;
  thisIsMultipleRelation?: Relation[]|null;
  thisIsJson?: unknown;
  thisIsGeoPoint?: { lat: number, lon: number };
};

export type SerializedUpdateTestRecord = {
  id: string;
  /** Must not be empty string. **/
  thisIsPlainText?: string;
  thisIsRichText?: string;
  thisIsNumber?: number;
  thisIsBoolean?: boolean;
  thisIsEmail?: string;
  thisIsUrl?: string;
  thisIsDateTime?: string;
  thisIsSelect?: "somebody"|"once"|"told"|"me";
  thisIsFile?: File|undefined|"";
  thisIsMultipleFile?: File[]|undefined|[];
  "thisIsMultipleFile+"?: File[];
  "+thisIsMultipleFile"?: File[];
  "thisIsMultipleFile-"?: string[];
  thisIsRelation?: string;
  thisIsMultipleRelation?: string[];
  thisIsJson?: unknown;
  thisIsGeoPoint?: { lat: number, lon: number };
};

export type TestRecordExpand = {
  thisIsRelation?: UserExpand;
  thisIsMultipleRelation?: TestRecordExpand;
};

export type ResolvedTestRecordExpand<T extends TestRecordExpand> = {
  thisIsRelation: undefined extends T["thisIsRelation"]
    ? never
    : TestRecord & { expand: ResolvedTestRecordExpand<NonNullable<T["thisIsRelation"]>> }
  ;
  thisIsMultipleRelation: undefined extends T["thisIsMultipleRelation"]
    ? never
    : (TestRecord & { expand: ResolvedTestRecordExpand<NonNullable<T["thisIsMultipleRelation"]>> })[]
  ;
};

export type TestRecordCommonOptions = {
  fields?: Array<"id"|"thisIsPlainText"|"thisIsRichText"|"thisIsNumber"|"thisIsBoolean"|"thisIsEmail"|"thisIsUrl"|"thisIsDateTime"|"thisIsAutoDate"|"thisIsSelect"|"thisIsFile"|"thisIsMultipleFile"|"thisIsRelation"|"thisIsMultipleRelation"|"thisIsJson"|"thisIsGeoPoint"|"created"|"updated">;
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
    thisIsRichText: record.thisIsRichText === "" ? null : record.thisIsRichText,
    thisIsEmail: record.thisIsEmail === "" ? null : record.thisIsEmail,
    thisIsUrl: record.thisIsUrl === "" ? null : record.thisIsUrl,
    thisIsDateTime: record.thisIsDateTime === "" ? null : parseISO(record.thisIsDateTime),
    thisIsAutoDate: parseISO(record.thisIsAutoDate),
    thisIsRelation: record.thisIsRelation === "" ? null : record.thisIsRelation,
    thisIsMultipleRelation: record.thisIsMultipleRelation.length === 0 ? null : record.thisIsMultipleRelation,
    expand: record.expand && {
      thisIsRelation: record.expand.thisIsRelation
        ? parseUser(record.expand.thisIsRelation)
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
    thisIsRichText: record.thisIsRichText ?? "",
    thisIsEmail: record.thisIsEmail ?? "",
    thisIsUrl: record.thisIsUrl ?? "",
    thisIsDateTime: record.thisIsDateTime ? formatISO(record.thisIsDateTime) : "",
    thisIsAutoDate: formatISO(record.thisIsAutoDate),
    thisIsRelation: record.thisIsRelation ?? "",
    thisIsMultipleRelation: record.thisIsMultipleRelation ?? [],
    expand: record.expand && {
      thisIsRelation: record.expand.thisIsRelation
        ? serializeUser(record.expand.thisIsRelation)
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
    thisIsRichText: record.thisIsRichText ?? "",
    thisIsEmail: record.thisIsEmail ?? "",
    thisIsUrl: record.thisIsUrl ?? "",
    thisIsDateTime: record.thisIsDateTime ? formatISO(record.thisIsDateTime) : "",
    thisIsRelation: record.thisIsRelation ?? "",
    thisIsMultipleRelation: record.thisIsMultipleRelation ?? [],
  };
}

export function serializeUpdateTestRecord(record: UpdateTestRecord): SerializedUpdateTestRecord {
  return {
    ...record,
    thisIsRichText: record.thisIsRichText ?? "",
    thisIsEmail: record.thisIsEmail ?? "",
    thisIsUrl: record.thisIsUrl ?? "",
    thisIsDateTime: record.thisIsDateTime ? formatISO(record.thisIsDateTime) : "",
    thisIsRelation: record.thisIsRelation ?? "",
    thisIsMultipleRelation: record.thisIsMultipleRelation ?? [],
  };
}

function getTagsForTestRecord(record: SerializedTestRecord): Tag[] {
  return ([
    { type: "testCollection", id: record.id },
    ...(!record.expand.thisIsRelation ? [] : getTagsForUser(record.expand.thisIsRelation)),
    record.expand.thisIsMultipleRelation && { type: "testCollection", id: `LIST-testCollection-${record.id}` } as const,
    ...(record.expand.thisIsMultipleRelation ?? []).map((e) => getTagsForTestRecord(e)).flat(),
  ] as const).filter((t) => !!t);
}

export const testRecordsApiInternal = api.injectEndpoints({
  endpoints: (build) => ({
    getOneTestRecord: build.query<SerializedTestRecord, string|({ id: string } & TestRecordRecordOptions)>({
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
        : getTagsForTestRecord(result)
      ,
    }),

    getListTestRecords: build.query<ListResult<SerializedTestRecord>, TestRecordRecordListOptions|void>({
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
          ...result.items.map((record) => getTagsForTestRecord(record)).flat(),
        ]
      ,
    }),

    getFullListTestRecords: build.query<SerializedTestRecord[], TestRecordRecordFullListOptions|void>({
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
          ...result.map((record) => getTagsForTestRecord(record)).flat(),
        ]
      ,
    }),

    createTestRecord: build.mutation<SerializedTestRecord, { record: CreateTestRecord } & TestRecordRecordOptions>({
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
      invalidatesTags: (result, error, args) => !result
        ? []
        : [{ type: "testCollection", id: "LIST-testRecords" }]
      ,
    }),

    updateTestRecord: build.mutation<SerializedTestRecord, { record: UpdateTestRecord } & TestRecordRecordOptions>({
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

export const testRecordsApi = {
  ...testRecordsApiInternal,
  useGetOneTestRecordQuery: function<T extends TestRecordExpand>(
    args: Parameters<typeof testRecordsApiInternal.useGetOneTestRecordQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testRecordsApiInternal.useGetOneTestRecordQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useGetOneTestRecordQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestRecord(result.data) as TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        },
        currentData: result.currentData && parseTestRecord(result.currentData) as TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        },
      }),
    });
  },

  useLazyGetOneTestRecordQuery: function<T extends TestRecordExpand>(
    options?: Omit<Parameters<typeof testRecordsApiInternal.useLazyGetOneTestRecordQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useLazyGetOneTestRecordQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestRecord(result.data) as TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        },
        currentData: result.currentData && parseTestRecord(result.currentData) as TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        },
      }),
    });
  },

  useGetListTestRecordsQuery: function<T extends TestRecordExpand>(
    args: Parameters<typeof testRecordsApiInternal.useGetListTestRecordsQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testRecordsApiInternal.useGetListTestRecordsQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useGetListTestRecordsQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseTestRecord) as Array<TestRecord & {
            expand: ResolvedTestRecordExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseTestRecord) as Array<TestRecord & {
            expand: ResolvedTestRecordExpand<T>,
          }>,
        },
      }),
    });
  },

  useLazyGetListTestRecordsQuery: function<T extends TestRecordExpand>(
    options?: Omit<Parameters<typeof testRecordsApiInternal.useLazyGetListTestRecordsQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useLazyGetListTestRecordsQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseTestRecord) as Array<TestRecord & {
            expand: ResolvedTestRecordExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseTestRecord) as Array<TestRecord & {
            expand: ResolvedTestRecordExpand<T>,
          }>,
        },
      }),
    });
  },

  useGetFullListTestRecordsQuery: function<T extends TestRecordExpand>(
    args: Parameters<typeof testRecordsApiInternal.useGetFullListTestRecordsQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testRecordsApiInternal.useGetFullListTestRecordsQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useGetFullListTestRecordsQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseTestRecord) as Array<TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        }>,
        currentData: result.currentData?.map(parseTestRecord) as Array<TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        }>,
      }),
    });
  },

  useLazyGetFullListTestRecordsQuery: function<T extends TestRecordExpand>(
    options?: Omit<Parameters<typeof testRecordsApiInternal.useLazyGetFullListTestRecordsQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useLazyGetFullListTestRecordsQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseTestRecord) as Array<TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        }>,
        currentData: result.currentData?.map(parseTestRecord) as Array<TestRecord & {
          expand: ResolvedTestRecordExpand<T>,
        }>,
      }),
    });
  },

  useCreateTestRecordMutation: function<T extends TestRecordExpand>(
    options?: Omit<Parameters<typeof testRecordsApiInternal.useCreateTestRecordMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useCreateTestRecordMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestRecord(result.data) as TestRecord,
      }),
    });
  },

  useUpdateTestRecordMutation: function<T extends TestRecordExpand>(
    options?: Omit<Parameters<typeof testRecordsApiInternal.useUpdateTestRecordMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testRecordsApiInternal.useUpdateTestRecordMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestRecord(result.data) as TestRecord,
      }),
    });
  },
};

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
