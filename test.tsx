import { formatISO } from "date-fns";
import { driversApi } from "./out";


const getDriverQuery = driversApi.useGetOneDriverQuery("1234");

// createDriver({
//   record: {
//     fullName: "Rafael",
//     email: "rafa@bulsing.com",
//     deleted: new Date(),
//   },
//   expand: {
//     vehicle: {}
//   }
// })
