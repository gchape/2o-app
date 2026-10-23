import { z } from "zod";
import { categorySlugs, departmentSlugs } from "#/data/catalog";

export const departmentSchema = z.enum(departmentSlugs);
export const categorySchema = z.enum(categorySlugs);

export const productSlugSchema = z.string().min(1).max(200);

/** Products in the home page's drops row. */
export const HOME_DEALS_COUNT = 12;

/** Listings load a page at a time while the visitor scrolls. */
export const DEALS_PAGE_SIZE = 48;
export const PRODUCTS_PAGE_SIZE = 48;

const MAX_PAGE = 10_000;
const pageSchema = z.number().int().min(1).max(MAX_PAGE);

export const dealsPageSchema = z.object({ page: pageSchema });

export const productsPageSchema = z.object({
	department: departmentSchema,
	category: categorySchema.optional(),
	page: pageSchema,
});
