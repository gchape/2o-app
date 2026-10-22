import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cart } from "./cart.server";
import { MAX_QUANTITY } from "./cart.types";

const sku = z.uuid();

export const getCartFn = createServerFn().handler(() => cart.get());

export const addItemFn = createServerFn({ method: "POST" })
	.validator(z.object({ sku }))
	.handler(({ data }) => cart.add(data.sku));

export const setQuantityFn = createServerFn({ method: "POST" })
	.validator(z.object({ sku, quantity: z.int().min(0).max(MAX_QUANTITY) }))
	.handler(({ data }) => cart.setQuantity(data.sku, data.quantity));

export const clearCartFn = createServerFn({ method: "POST" }).handler(() =>
	cart.clear(),
);
