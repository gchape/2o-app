import { and, eq, gt } from "drizzle-orm";
import { skus } from "./schema";

/**
 * An in-stock SKU with a real discount. Uses the generated `skus.discount`
 * column, so the predicate matches the partial `skus_deals_idx` index.
 */
export const onSale = and(eq(skus.inStock, true), gt(skus.discount, 0));
