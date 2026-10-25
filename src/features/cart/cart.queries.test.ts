import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import type { CartItem } from "./cart";
import { getCartFn } from "./cart.functions";
import { cartQuery } from "./cart.queries";

vi.mock("./cart.functions", () => ({ getCartFn: vi.fn() }));

it("aborts the transport and preserves the cart when a pending read is cancelled", async () => {
	const client = new QueryClient();
	const response = Promise.withResolvers<CartItem[]>();
	vi.mocked(getCartFn).mockReturnValue(response.promise);
	client.setQueryData(cartQuery.queryKey, []);
	const request = client.query(cartQuery).catch((error: unknown) => error);
	const signal = vi.mocked(getCartFn).mock.calls[0]?.[0]?.signal;
	expect(signal).toBeInstanceOf(AbortSignal);

	await client.cancelQueries({ queryKey: cartQuery.queryKey });
	expect(signal?.aborted).toBe(true);
	expect(await request).toEqual([]);
	response.resolve([
		{
			id: "stale",
			name: "Stale response",
			quantity: 1,
			price: 100,
			currency: "GEL",
			image: null,
		},
	]);
	await response.promise;
	expect(client.getQueryData(cartQuery.queryKey)).toEqual([]);
	client.clear();
});
