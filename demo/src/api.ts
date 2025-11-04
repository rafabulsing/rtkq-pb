import PocketBase, { RecordService, ListResult } from "pocketbase";
import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { parseISO, formatISO } from "date-fns";

export interface TypedPockedBase extends PocketBase {
  collection(idOrName: string): RecordService<never>;
  collection(idOrName: "users"): RecordService<SerializedUsers>;
  collection(idOrName: "testCollection"): RecordService<SerializedTestCollection>;
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

export type Users = {
  id: string;
  name: string;
  avatar: string;
  created: Date;
  updated: Date;
  email: Email,
  emailVisibility: boolean,
  verified: boolean,
};

export type SerializedUsers = {
  id: string;
  name: string;
  avatar: string;
  created: string;
  updated: string;
  email: string,
  emailVisibility: boolean,
  verified: boolean,
};

export type CreateUsers = {
  name: string;
  avatar: File;
  email: Email,
  emailVisibility?: boolean,
  verified?: boolean,
  password: string,
  passwordConfirm: string,
};

export type SerializedCreateUsers = {
  name: string;
  avatar: File|undefined|"";
  email: string,
  emailVisibility?: boolean,
  verified?: boolean,
  password: string,
  passwordConfirm: string,
};

export type UpdateUsers = {
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

export type SerializedUpdateUsers = {
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

export type UsersExpand = {
  [key: string]: never;  
};

export type ResolvedUsersExpand<T extends UsersExpand> = {
  [key: string]: never;  
};

export type UsersCommonOptions = {
  fields?: Array<"id"|"name"|"avatar"|"created"|"updated"|"created"|"updated">;
};

export type UsersListOptions = UsersCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type UsersFullListOptions = UsersListOptions & {
  expand?: UsersExpand;
  batch?: number;
};

export type UsersRecordOptions = UsersCommonOptions & {
  expand?: UsersExpand;
};

export type UsersRecordListOptions = unknown
  & UsersRecordOptions
  & UsersListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type UsersRecordFullListOptions =
  & UsersFullListOptions
  & UsersRecordOptions
;

export function parseUsers(record: SerializedUsers): Users {
  return {
    ...record,
    created: parseISO(record.created),
    updated: parseISO(record.updated),
  };
}

export function serializeUsers(record: Users): SerializedUsers {
  return {
    ...record,
    created: formatISO(record.created),
    updated: formatISO(record.updated),
  };
}

export function serializeCreateUsers(record: CreateUsers): SerializedCreateUsers {
  return {
    ...record,
  };
}

export function serializeUpdateUsers(record: UpdateUsers): SerializedUpdateUsers {
  return {
    ...record,
  };
}

function getTagsForUsers(record: SerializedUsers): Tag[] {
  return ([
    { type: "users", id: record.id },
  ] as const).filter((t) => !!t);
}

export const usersApiInternal = api.injectEndpoints({
  endpoints: (build) => ({
    getOneUsers: build.query<SerializedUsers, string|({ id: string } & UsersRecordOptions)>({
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
        : getTagsForUsers(result)
      ,
    }),

    getListUsers: build.query<ListResult<SerializedUsers>, UsersRecordListOptions|void>({
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
          ...result.items.map((record) => getTagsForUsers(record)).flat(),
        ]
      ,
    }),

    getFullListUsers: build.query<SerializedUsers[], UsersRecordFullListOptions|void>({
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
          ...result.map((record) => getTagsForUsers(record)).flat(),
        ]
      ,
    }),

    createUsers: build.mutation<SerializedUsers, { record: CreateUsers } & UsersRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateUsers(args.record);
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

    updateUsers: build.mutation<SerializedUsers, { record: UpdateUsers } & UsersRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateUsers(args.record);
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

    deleteUsers: build.mutation<boolean, string|({ id: string } & UsersCommonOptions)>({
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
  useGetOneUsersQuery: function<T extends UsersExpand>(
    args: Parameters<typeof usersApiInternal.useGetOneUsersQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetOneUsersQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetOneUsersQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUsers(result.data) as Users & {
          expand: ResolvedUsersExpand<T>,
        },
        currentData: result.currentData && parseUsers(result.currentData) as Users & {
          expand: ResolvedUsersExpand<T>,
        },
      }),
    });
  },

  useLazyGetOneUsersQuery: function<T extends UsersExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetOneUsersQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetOneUsersQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUsers(result.data) as Users & {
          expand: ResolvedUsersExpand<T>,
        },
        currentData: result.currentData && parseUsers(result.currentData) as Users & {
          expand: ResolvedUsersExpand<T>,
        },
      }),
    });
  },

  useGetListUsersQuery: function<T extends UsersExpand>(
    args: Parameters<typeof usersApiInternal.useGetListUsersQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetListUsersQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetListUsersQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseUsers) as Array<Users & {
            expand: ResolvedUsersExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseUsers) as Array<Users & {
            expand: ResolvedUsersExpand<T>,
          }>,
        },
      }),
    });
  },

  useLazyGetListUsersQuery: function<T extends UsersExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetListUsersQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetListUsersQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseUsers) as Array<Users & {
            expand: ResolvedUsersExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseUsers) as Array<Users & {
            expand: ResolvedUsersExpand<T>,
          }>,
        },
      }),
    });
  },

  useGetFullListUsersQuery: function<T extends UsersExpand>(
    args: Parameters<typeof usersApiInternal.useGetFullListUsersQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof usersApiInternal.useGetFullListUsersQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useGetFullListUsersQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseUsers) as Array<Users & {
          expand: ResolvedUsersExpand<T>,
        }>,
        currentData: result.currentData?.map(parseUsers) as Array<Users & {
          expand: ResolvedUsersExpand<T>,
        }>,
      }),
    });
  },

  useLazyGetFullListUsersQuery: function<T extends UsersExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useLazyGetFullListUsersQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useLazyGetFullListUsersQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseUsers) as Array<Users & {
          expand: ResolvedUsersExpand<T>,
        }>,
        currentData: result.currentData?.map(parseUsers) as Array<Users & {
          expand: ResolvedUsersExpand<T>,
        }>,
      }),
    });
  },

  useCreateUsersMutation: function<T extends UsersExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useCreateUsersMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useCreateUsersMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUsers(result.data) as Users,
      }),
    });
  },

  useUpdateUsersMutation: function<T extends UsersExpand>(
    options?: Omit<Parameters<typeof usersApiInternal.useUpdateUsersMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return usersApiInternal.useUpdateUsersMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseUsers(result.data) as Users,
      }),
    });
  },
};

export type TestCollection = {
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
    thisIsRelation?: Users;
    thisIsMultipleRelation?: TestCollection[];
  };
};

export type SerializedTestCollection = {
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
    thisIsRelation?: SerializedUsers;
    thisIsMultipleRelation?: SerializedTestCollection[];
  };
};

export type CreateTestCollection = {
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

export type SerializedCreateTestCollection = {
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

export type UpdateTestCollection = {
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

export type SerializedUpdateTestCollection = {
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

export type TestCollectionExpand = {
  thisIsRelation?: UsersExpand;
  thisIsMultipleRelation?: TestCollectionExpand;
};

export type ResolvedTestCollectionExpand<T extends TestCollectionExpand> = {
  thisIsRelation: undefined extends T["thisIsRelation"]
    ? never
    : TestCollection & { expand: ResolvedTestCollectionExpand<NonNullable<T["thisIsRelation"]>> }
  ;
  thisIsMultipleRelation: undefined extends T["thisIsMultipleRelation"]
    ? never
    : (TestCollection & { expand: ResolvedTestCollectionExpand<NonNullable<T["thisIsMultipleRelation"]>> })[]
  ;
};

export type TestCollectionCommonOptions = {
  fields?: Array<"id"|"thisIsPlainText"|"thisIsRichText"|"thisIsNumber"|"thisIsBoolean"|"thisIsEmail"|"thisIsUrl"|"thisIsDateTime"|"thisIsAutoDate"|"thisIsSelect"|"thisIsFile"|"thisIsMultipleFile"|"thisIsRelation"|"thisIsMultipleRelation"|"thisIsJson"|"thisIsGeoPoint"|"created"|"updated">;
};

export type TestCollectionListOptions = TestCollectionCommonOptions & {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  skipTotal?: boolean;
};

export type TestCollectionFullListOptions = TestCollectionListOptions & {
  expand?: TestCollectionExpand;
  batch?: number;
};

export type TestCollectionRecordOptions = TestCollectionCommonOptions & {
  expand?: TestCollectionExpand;
};

export type TestCollectionRecordListOptions = unknown
  & TestCollectionRecordOptions
  & TestCollectionListOptions
  & {
    page?: number;
    perPage?: number;
  }
;

export type TestCollectionRecordFullListOptions =
  & TestCollectionFullListOptions
  & TestCollectionRecordOptions
;

export function parseTestCollection(record: SerializedTestCollection): TestCollection {
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
        ? parseUsers(record.expand.thisIsRelation)
        : undefined
      ,
      thisIsMultipleRelation: record.expand.thisIsMultipleRelation
        ? record.expand.thisIsMultipleRelation.map(parseTestCollection)
        : undefined
      ,
    },
  };
}

export function serializeTestCollection(record: TestCollection): SerializedTestCollection {
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
        ? serializeUsers(record.expand.thisIsRelation)
        : undefined
      ,
      thisIsMultipleRelation: record.expand.thisIsMultipleRelation
        ? record.expand.thisIsMultipleRelation.map(serializeTestCollection)
        : undefined
      ,
    },
  };
}

export function serializeCreateTestCollection(record: CreateTestCollection): SerializedCreateTestCollection {
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

export function serializeUpdateTestCollection(record: UpdateTestCollection): SerializedUpdateTestCollection {
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

function getTagsForTestCollection(record: SerializedTestCollection): Tag[] {
  return ([
    { type: "testCollection", id: record.id },
    ...(!record.expand.thisIsRelation ? [] : getTagsForUsers(record.expand.thisIsRelation)),
    record.expand.thisIsMultipleRelation && { type: "testCollection", id: `LIST-testCollection-${record.id}` } as const,
    ...(record.expand.thisIsMultipleRelation ?? []).map((e) => getTagsForTestCollection(e)).flat(),
  ] as const).filter((t) => !!t);
}

export const testCollectionApiInternal = api.injectEndpoints({
  endpoints: (build) => ({
    getOneTestCollection: build.query<SerializedTestCollection, string|({ id: string } & TestCollectionRecordOptions)>({
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
        : getTagsForTestCollection(result)
      ,
    }),

    getListTestCollection: build.query<ListResult<SerializedTestCollection>, TestCollectionRecordListOptions|void>({
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
          { type: "testCollection", id: "LIST-testCollection" },
          ...result.items.map((record) => getTagsForTestCollection(record)).flat(),
        ]
      ,
    }),

    getFullListTestCollection: build.query<SerializedTestCollection[], TestCollectionRecordFullListOptions|void>({
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
          { type: "testCollection", id: "LIST-testCollection" },
          ...result.map((record) => getTagsForTestCollection(record)).flat(),
        ]
      ,
    }),

    createTestCollection: build.mutation<SerializedTestCollection, { record: CreateTestCollection } & TestCollectionRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeCreateTestCollection(args.record);
          const data = await pb.collection("testCollection").create(serializedRecord, options);
          return { data };
        } catch (error: any) {
          return { error };
        }
      },
      invalidatesTags: (result, error, args) => !result
        ? []
        : [{ type: "testCollection", id: "LIST-testCollection" }]
      ,
    }),

    updateTestCollection: build.mutation<SerializedTestCollection, { record: UpdateTestCollection } & TestCollectionRecordOptions>({
      queryFn: async (args) => {
        try {
          const options = {
            ...args,
            expand: getExpandString(args.expand),
            fields: getFieldsString(args.fields),
          };
          const serializedRecord = serializeUpdateTestCollection(args.record);
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

    deleteTestCollection: build.mutation<boolean, string|({ id: string } & TestCollectionCommonOptions)>({
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

export const testCollectionApi = {
  ...testCollectionApiInternal,
  useGetOneTestCollectionQuery: function<T extends TestCollectionExpand>(
    args: Parameters<typeof testCollectionApiInternal.useGetOneTestCollectionQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testCollectionApiInternal.useGetOneTestCollectionQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useGetOneTestCollectionQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestCollection(result.data) as TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        },
        currentData: result.currentData && parseTestCollection(result.currentData) as TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        },
      }),
    });
  },

  useLazyGetOneTestCollectionQuery: function<T extends TestCollectionExpand>(
    options?: Omit<Parameters<typeof testCollectionApiInternal.useLazyGetOneTestCollectionQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useLazyGetOneTestCollectionQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestCollection(result.data) as TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        },
        currentData: result.currentData && parseTestCollection(result.currentData) as TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        },
      }),
    });
  },

  useGetListTestCollectionQuery: function<T extends TestCollectionExpand>(
    args: Parameters<typeof testCollectionApiInternal.useGetListTestCollectionQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testCollectionApiInternal.useGetListTestCollectionQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useGetListTestCollectionQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseTestCollection) as Array<TestCollection & {
            expand: ResolvedTestCollectionExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseTestCollection) as Array<TestCollection & {
            expand: ResolvedTestCollectionExpand<T>,
          }>,
        },
      }),
    });
  },

  useLazyGetListTestCollectionQuery: function<T extends TestCollectionExpand>(
    options?: Omit<Parameters<typeof testCollectionApiInternal.useLazyGetListTestCollectionQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useLazyGetListTestCollectionQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && {
          ...result.data,
          items: result.data.items.map(parseTestCollection) as Array<TestCollection & {
            expand: ResolvedTestCollectionExpand<T>,
          }>,
        },
        currentData: result.currentData && {
          ...result.currentData,
          items: result.currentData.items.map(parseTestCollection) as Array<TestCollection & {
            expand: ResolvedTestCollectionExpand<T>,
          }>,
        },
      }),
    });
  },

  useGetFullListTestCollectionQuery: function<T extends TestCollectionExpand>(
    args: Parameters<typeof testCollectionApiInternal.useGetFullListTestCollectionQuery>[0] & { expand?: T },
    options?: Omit<Parameters<typeof testCollectionApiInternal.useGetFullListTestCollectionQuery>[1], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useGetFullListTestCollectionQuery(args, {
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseTestCollection) as Array<TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        }>,
        currentData: result.currentData?.map(parseTestCollection) as Array<TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        }>,
      }),
    });
  },

  useLazyGetFullListTestCollectionQuery: function<T extends TestCollectionExpand>(
    options?: Omit<Parameters<typeof testCollectionApiInternal.useLazyGetFullListTestCollectionQuery>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useLazyGetFullListTestCollectionQuery({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data?.map(parseTestCollection) as Array<TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        }>,
        currentData: result.currentData?.map(parseTestCollection) as Array<TestCollection & {
          expand: ResolvedTestCollectionExpand<T>,
        }>,
      }),
    });
  },

  useCreateTestCollectionMutation: function<T extends TestCollectionExpand>(
    options?: Omit<Parameters<typeof testCollectionApiInternal.useCreateTestCollectionMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useCreateTestCollectionMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestCollection(result.data) as TestCollection,
      }),
    });
  },

  useUpdateTestCollectionMutation: function<T extends TestCollectionExpand>(
    options?: Omit<Parameters<typeof testCollectionApiInternal.useUpdateTestCollectionMutation>[0], "selectFromResult"> & { selectFromResult?: undefined },
  ) {
    return testCollectionApiInternal.useUpdateTestCollectionMutation({
      ...options,
      selectFromResult: (result) => ({
        ...result,
        data: result.data && parseTestCollection(result.data) as TestCollection,
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
