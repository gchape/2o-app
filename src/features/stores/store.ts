import { z } from "zod";

/** Public store URLs contain an opaque identifier, never a supplier domain. */
export const storeIdSchema = z.string().regex(/^[a-f0-9]{64}$/);

/** A short display code; routing and shipping always use the full identifier. */
export const storeCode = (storeId: string) => storeId.slice(0, 8).toUpperCase();
