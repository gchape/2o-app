import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { cartMutationOptions } from "./cart.mutations";
import { cartQuery } from "./cart.queries";

vi.mock("./cart.functions", () => ({ getCartFn: vi.fn() }));

it("serializes cart writes across components and refreshes after the last one", async () => {
	const client = new QueryClient();
	const firstResponse = Promise.withResolvers<void>();
	const secondResponse = Promise.withResolvers<void>();
	const firstWrite = vi.fn(() => firstResponse.promise);
	const secondWrite = vi.fn(() => secondResponse.promise);
	const invalidate = vi.spyOn(client, "invalidateQueries");
	const first = client.getMutationCache().build(client, {
		...cartMutationOptions(client),
		mutationFn: firstWrite,
	});
	const second = client.getMutationCache().build(client, {
		...cartMutationOptions(client),
		mutationFn: secondWrite,
	});

	const firstRequest = first.execute(undefined);
	const secondRequest = second.execute(undefined);
	await vi.waitFor(() => expect(firstWrite).toHaveBeenCalledOnce());
	expect(secondWrite).not.toHaveBeenCalled();
	firstResponse.resolve();
	await firstRequest;
	await vi.waitFor(() => expect(secondWrite).toHaveBeenCalledOnce());
	expect(invalidate).not.toHaveBeenCalled();

	secondResponse.resolve();
	await secondRequest;
	expect(invalidate).toHaveBeenCalledExactlyOnceWith({
		queryKey: cartQuery.queryKey,
	});
	client.clear();
});

it("continues the queue after a failed write without restoring an old cart", async () => {
	const client = new QueryClient();
	const saved = [
		{
			id: "sku",
			name: "Shoes",
			price: 5000,
			currency: "GEL",
			image: null,
			quantity: 2,
		},
	];
	client.setQueryData(cartQuery.queryKey, saved);
	const failure = new Error("Unavailable");
	const first = client.getMutationCache().build(client, {
		...cartMutationOptions(client),
		mutationFn: async () => {
			throw failure;
		},
	});
	const nextWrite = vi.fn(async () => undefined);
	const second = client.getMutationCache().build(client, {
		...cartMutationOptions(client),
		mutationFn: nextWrite,
	});
	const rejected = first.execute(undefined).catch((error: unknown) => error);
	const next = second.execute(undefined);
	expect(await rejected).toBe(failure);
	await next;
	expect(nextWrite).toHaveBeenCalledOnce();
	expect(client.getQueryData(cartQuery.queryKey)).toEqual(saved);
	client.clear();
});
