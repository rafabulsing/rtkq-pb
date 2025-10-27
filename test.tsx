import { formatISO } from "date-fns";
import { parseTestRecord, ResolvedTestRecordExpand, SerializedTestRecord, TestRecord, TestRecordExpand, testRecordsApi, testRecordsApiInternal } from "./demo/src/api";
import { BaseQueryFn, skipToken, TypedUseQueryStateResult } from "@reduxjs/toolkit/query/react";

const getRecords = testRecordsApi.useGetFullListTestRecordsQuery({
  expand: {
    thisIsSingleRelation: {},
    thisIsMultipleRelation: {},
  },
});

type Test = ReturnType<typeof testRecordsApiInternal.useGetOneTestRecordQuery<
  TypedUseQueryStateResult<number, any, any>
>>;

function useGetOneTestRecordQuery<T extends TestRecordExpand>(
  arg0: Parameters<typeof testRecordsApiInternal.useGetOneTestRecordQuery>[0] & { expand?: T },
  arg1?: Omit<Parameters<typeof testRecordsApiInternal.useGetOneTestRecordQuery>[1], "selectFromResult"> & { selectFromResult: undefined }
) {
  return testRecordsApiInternal.useGetOneTestRecordQuery(arg0, {
    ...arg1,
    selectFromResult: (result) => ({
      ...result,
      data: result.data && parseTestRecord(result.data) as TestRecord & {
        expand: ResolvedTestRecordExpand<T>,
      },
      currentData: result.currentData && parseTestRecord(result.currentData),
    }),
  });
}

function test() {
  const query = testRecordsApi.useGetListTestRecordsQuery({
    expand: { thisIsMultipleRelation: { thisIsSingleRelation: {}}},
  }, {});

}