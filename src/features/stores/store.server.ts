import { createHmac } from "node:crypto";
import { env } from "#/server/env.server";

/** Shared with existing shipment IDs; a keyed digest prevents domain guessing. */
export const publicStoreId = (warehouse: string) =>
	createHmac("sha256", env.BETTER_AUTH_SECRET).update(warehouse).digest("hex");
