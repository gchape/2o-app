import { createServerFn } from "@tanstack/react-start";
import {
	DEALS_PAGE_SIZE,
	dealsPageSchema,
	HOME_DEALS_COUNT,
	PRODUCTS_PAGE_SIZE,
	productSlugSchema,
	productsPageSchema,
} from "./product.schema";
import { findProductBySlug, listDeals, listProducts } from "./product.server";

/** One page of a department (or category) listing. */
export const getProductsFn = createServerFn({ method: "GET" })
	.validator(productsPageSchema)
	.handler(async ({ data }) => {
		// One extra row tells us whether another page exists.
		const rows = await listProducts(
			data.department,
			data.category,
			PRODUCTS_PAGE_SIZE + 1,
			(data.page - 1) * PRODUCTS_PAGE_SIZE,
		);
		return {
			products: rows.slice(0, PRODUCTS_PAGE_SIZE),
			hasMore: rows.length > PRODUCTS_PAGE_SIZE,
		};
	});

export const getProductFn = createServerFn({ method: "GET" })
	.validator(productSlugSchema)
	.handler(({ data }) => findProductBySlug(data));

/** The home page's drops row. */
export const getHomeDealsFn = createServerFn({ method: "GET" }).handler(() =>
	listDeals(HOME_DEALS_COUNT),
);

/** One page of products on sale, biggest discount first (/deals). */
export const getDealsFn = createServerFn({ method: "GET" })
	.validator(dealsPageSchema)
	.handler(async ({ data }) => {
		const rows = await listDeals(
			DEALS_PAGE_SIZE + 1,
			(data.page - 1) * DEALS_PAGE_SIZE,
		);
		return {
			deals: rows.slice(0, DEALS_PAGE_SIZE),
			hasMore: rows.length > DEALS_PAGE_SIZE,
		};
	});

/** A product with its SKUs, as rendered on the product page. */
export type ProductDetail = NonNullable<
	Awaited<ReturnType<typeof getProductFn>>
>;
