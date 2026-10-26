import { beforeEach, expect, it, vi } from "vitest";
import {
	checkoutSession,
	orderItem,
	orderNotification,
	orders,
} from "#/db/schema";
import { calculateQuote } from "./checkout";

const state = vi.hoisted(() => ({
	rows: [] as unknown[][],
	inserts: [] as { table: unknown; value: unknown }[],
	updates: [] as { table: unknown; value: unknown }[],
	remove: vi.fn(),
	cart: vi.fn(),
	rollback: vi.fn(),
}));
vi.mock("#/db", () => {
	const tx = {
		select: () => {
			const rows = state.rows.shift() ?? [];
			const query = {
				from: (_table: unknown) => query,
				where: (_filter: unknown) => query,
				for: (_lock: string) => query,
				// biome-ignore lint/suspicious/noThenProperty: Drizzle query builders are intentionally awaitable.
				then: (resolve: (rows: unknown[]) => unknown) =>
					Promise.resolve(rows).then(resolve),
			};
			return query;
		},
		insert: (table: unknown) => ({
			values: async (value: unknown) => {
				state.inserts.push({ table, value });
			},
		}),
		update: (table: unknown) => ({
			set: (value: unknown) => ({
				where: async (_filter: unknown) => {
					state.updates.push({ table, value });
				},
			}),
		}),
	};
	const db = {
		...tx,
		transaction: async <T>(
			fn: (connection: typeof tx) => Promise<T>,
		): Promise<T> => {
			const before = state.inserts.length;
			try {
				return await fn(tx);
			} catch (error) {
				state.inserts.splice(before);
				state.rollback();
				throw error;
			}
		},
	};
	return { db };
});
vi.mock("#/features/cart/cart.server", () => ({
	cart: { removePurchased: state.remove, getForCheckout: state.cart },
}));
vi.mock("./checkout-config.server", () => ({ checkoutPricing: () => null }));
const { getCheckout, submitCheckout, uploadProof } = await import(
	"./checkout.server"
);
const id = "00000000-0000-4000-8000-000000000001";
const quote = calculateQuote(
	[
		{
			id,
			name: "Shoes (Black, 8)",
			price: 13500,
			currency: "GEL",
			quantity: 1,
			image: null,
		},
	],
	{
		gelPerUsd: 2.7,
		rateUpdatedAt: "2026-10-26T00:00:00Z",
		serviceFeeBps: 500,
		shippingUsd: 700,
		paymentCurrency: "USD",
		iban: "GE29NB0000000101904917",
		beneficiary: "Test",
	},
);
const shippingAddress = {
	fullName: "Buyer",
	phone: "1234567",
	line1: "123 Main",
	line2: "",
	city: "Wilmington",
	state: "DE",
	postalCode: "19804",
	country: "US",
};
const draft = {
	id,
	quote,
	shippingAddress,
	proofBase64: "private-proof",
	proofType: "image/png",
	submittedAt: null,
};
const publicRow = {
	id,
	quote,
	address: shippingAddress,
	expiresAt: new Date("2026-10-27T00:00:00Z"),
	proofUploaded: true,
	submittedAt: new Date("2026-10-26T12:00:00Z"),
};
beforeEach(() => {
	state.rows.length = 0;
	state.inserts.length = 0;
	state.updates.length = 0;
	vi.clearAllMocks();
});

it("requires ownership before reading or uploading a receipt", async () => {
	state.rows.push([]);
	await expect(getCheckout("other-user", id)).rejects.toThrow(
		"Checkout not found",
	);
	state.rows.push([]);
	await expect(
		uploadProof(
			"other-user",
			id,
			new File(["proof"], "proof.png", { type: "image/png" }),
		),
	).rejects.toThrow("Checkout not found");
	expect(state.updates).toHaveLength(0);
});
it("rejects order submission without a persisted payment receipt", async () => {
	state.rows.push([{ ...draft, proofBase64: null }]);
	await expect(submitCheckout("buyer", id)).rejects.toThrow(
		"Upload your payment screenshot",
	);
	expect(state.inserts).toHaveLength(0);
	expect(state.remove).not.toHaveBeenCalled();
});
it("atomically stores an order, item snapshots, and notification as pending, not paid", async () => {
	state.rows.push(
		[draft],
		[{ name: "Buyer", email: "buyer@example.com" }],
		[{ id, color: "Black", size: "8" }],
		[publicRow],
	);
	const result = await submitCheckout("buyer", id);
	expect(state.inserts).toEqual([
		{
			table: orders,
			value: expect.objectContaining({
				id,
				userId: "buyer",
				status: "pending",
				currency: "USD",
				total: 5950,
				checkoutQuote: quote,
				customerEmail: "buyer@example.com",
			}),
		},
		{
			table: orderItem,
			value: expect.objectContaining({
				orderId: id,
				price: 5000,
				quantity: 1,
				name: "Shoes (Black, 8)",
			}),
		},
		{ table: orderNotification, value: { orderId: id } },
	]);
	expect(state.updates).toContainEqual({
		table: checkoutSession,
		value: { submittedAt: expect.any(Date) },
	});
	expect(state.remove).toHaveBeenCalledExactlyOnceWith(quote.lines);
	expect(result).toMatchObject({
		id,
		proofUploaded: true,
		submittedAt: "2026-10-26T12:00:00.000Z",
	});
	expect(result).not.toHaveProperty("proofBase64");
});
it("returns the same order on retry without another insert or cart removal", async () => {
	state.rows.push([{ ...draft, submittedAt: new Date() }], [publicRow]);
	expect((await submitCheckout("buyer", id)).id).toBe(id);
	expect(state.inserts).toHaveLength(0);
	expect(state.remove).not.toHaveBeenCalled();
});
