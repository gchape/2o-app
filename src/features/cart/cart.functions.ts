import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_QUANTITY } from "./cart";
import { cart } from "./cart.server";

const skuInput = z.object({ sku: z.uuid() });
const quantityInput = skuInput.extend({
	quantity: z.int().min(0).max(MAX_QUANTITY),
});

export const getCartFn = createServerFn().handler(() => cart.get());

export const addItemFn = createServerFn({ method: "POST" })
	.validator(skuInput)
	.handler(({ data }) => cart.add(data.sku));

export const setQuantityFn = createServerFn({ method: "POST" })
	.validator(quantityInput)
	.handler(({ data }) => cart.setQuantity(data.sku, data.quantity));
