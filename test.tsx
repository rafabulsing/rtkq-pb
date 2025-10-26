import { formatISO } from "date-fns";
import { TestRecord, TestRecordExpand, testRecordsApi } from "./demo/src/api";

const getRecords = testRecordsApi.useGetFullListTestRecordsQuery({
  expand: {
    thisIsSingleRelation: {},
    thisIsMultipleRelation: {},
  },
});

type ResolvedExpand<T extends TestRecordExpand> = {
  thisIsSingleRelation: undefined extends T['thisIsSingleRelation']
    ? never
    : TestRecord & { expand: ResolvedExpand<NonNullable<T['thisIsSingleRelation']>>}
  ;

  thisIsMultipleRelation: undefined extends T['thisIsMultipleRelation']
    ? never
    : (TestRecord & { expand: ResolvedExpand<NonNullable<T['thisIsMultipleRelation']>> })[]
  ;
}

function test<T extends TestRecordExpand>(expand: T): TestRecord & { expand: ResolvedExpand<T> } {
  return 2 as any as TestRecord & { expand: ResolvedExpand<T> };
}

const result = test({
  thisIsSingleRelation: { thisIsSingleRelation: {} },
  thisIsMultipleRelation: { thisIsSingleRelation: { thisIsMultipleRelation: {}}},
} as const);

result.expand.thisIsSingleRelation.expand.thisIsSingleRelation.expand;
const r = result.expand.thisIsMultipleRelation[0];
console.log(r.expand.thisIsSingleRelation.expand.thisIsMultipleRelation);

getRecords.data![0]!.expand.thisIsSingleRelation;
getRecords.data![0]!.expand.thisIsMultipleRelation;