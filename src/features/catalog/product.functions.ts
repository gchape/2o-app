import { createServerFn } from "@tanstack/react-start";
import { productSlugSchema } from "./product.schema";
import { findProductBySlug } from "./product.server";

export const getProductFn = createServerFn({ method: "GET" })
	.validator(productSlugSchema)
	.handler(({ data }) => findProductBySlug(data));

/** A product with its SKUs, as rendered on the product page. */
export type ProductDetail = NonNullable<
	Awaited<ReturnType<typeof getProductFn>>
>;
