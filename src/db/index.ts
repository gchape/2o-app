import { drizzle } from "drizzle-orm/node-postgres";
import { dbConnection } from "./connection";
import { relations } from "./schema";

export const db = drizzle({ connection: dbConnection, relations });
