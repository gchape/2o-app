import { createServerFn } from "@tanstack/react-start";
import { productFiltersSchema, productSlugSchema } from "./product.schema";
import { findProductBySlug, listProducts } from "./product.server";

export const getProductsFn = createServerFn({ method: "GET" })
	.validator(productFiltersSchema)
	.handler(({ data }) => listProducts(data.department, data.category));

export const getProductFn = createServerFn({ method: "GET" })
	.validator(productSlugSchema)
	.handler(({ data }) => findProductBySlug(data));
