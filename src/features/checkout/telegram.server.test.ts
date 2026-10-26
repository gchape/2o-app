import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { calculateQuote } from "./checkout-quote.server";

const state = vi.hoisted(() => ({
	rows: [] as unknown[][],
	updates: [] as Record<string, unknown>[],
	fetch: vi.fn(),
}));
vi.mock("#/server/env.server", () => ({
	env: {
		TELEGRAM_BOT_TOKEN: "secret-test-token",
		TELEGRAM_CHAT_ID: "private-chat",
	},
}));
vi.mock("#/db", () => {
	const tx = {
		select: () => {
			const rows = state.rows.shift() ?? [];
			const query = {
				from: (_table: unknown) => query,
				where: (_filter: unknown) => query,
				orderBy: (_order: unknown) => query,
				limit: (_count: number) => query,
				for: (_lock: string, _options: unknown) => query,
				// biome-ignore lint/suspicious/noThenProperty: Drizzle query builders are intentionally awaitable.
				then: (resolve: (rows: unknown[]) => unknown) =>
					Promise.resolve(rows).then(resolve),
			};
			return query;
		},
		update: (_table: unknown) => ({
			set: (value: Record<string, unknown>) => ({
				where: async (_filter: unknown) => {
					state.updates.push(value);
				},
			}),
		}),
	};
	return {
		db: {
			...tx,
			transaction: <T>(fn: (connection: typeof tx) => Promise<T>) => fn(tx),
		},
	};
});
const { deliverOrderNotification } = await import("./telegram.server");
const quote = calculateQuote(
	[
		{
			id: "sku",
			name: "Shoes",
			price: 10000,
			currency: "USD",
			quantity: 1,
			image: null,
		},
	],
	{
		gelPerUsd: 2.7,
		rateDate: "2026-10-26T00:00:00Z",
		serviceFeeBps: 500,
		shippingUsd: 700,
		iban: "GE29NB0000000101904917",
	},
);
const order = {
	id: "order",
	checkoutQuote: quote,
	customerName: "Buyer",
	customerEmail: "buyer@example.com",
	createdAt: new Date("2026-10-26T12:00:00Z"),
};
const draft = {
	proofBase64: Buffer.from("proof").toString("base64"),
	proofType: "image/png",
	shippingAddress: {
		fullName: "Buyer",
		phone: "1234567",
		line1: "123 Main",
		line2: "",
		city: "Wilmington",
		state: "DE",
		postalCode: "19804",
		country: "US",
	},
};
const job = { orderId: "order", nextMessage: 0, proofSent: false, attempts: 0 };

beforeEach(() => {
	vi.clearAllMocks();
	state.rows.length = 0;
	state.updates.length = 0;
	vi.stubGlobal("fetch", state.fetch);
	state.fetch.mockImplementation(async () => Response.json({ ok: true }));
});
afterEach(() => vi.unstubAllGlobals());
it("sends an escaped order message and private receipt, then marks delivery complete", async () => {
	state.rows.push([job], [order], [draft]);
	expect(await deliverOrderNotification()).toBe(true);
	expect(state.fetch).toHaveBeenCalledTimes(2);
	expect(state.fetch.mock.calls[0]?.[0]).toContain("/sendMessage");
	const message = JSON.parse(state.fetch.mock.calls[0]?.[1].body);
	expect(message).toMatchObject({
		chat_id: "private-chat",
		parse_mode: "HTML",
	});
	expect(message.text).toContain("buyer@example.com");
	expect(state.fetch.mock.calls[1]?.[0]).toContain("/sendDocument");
	const upload = state.fetch.mock.calls[1]?.[1].body as FormData;
	expect(upload.get("document")).toBeInstanceOf(File);
	expect(state.updates).toContainEqual({ nextMessage: 1 });
	expect(state.updates).toContainEqual({ proofSent: true });
	expect(state.updates).toContainEqual({
		sentAt: expect.any(Date),
		leaseUntil: null,
	});
});
it("retains delivery progress on failure and resumes with the receipt only", async () => {
	state.rows.push([job], [order], [draft]);
	state.fetch
		.mockImplementationOnce(async () => Response.json({ ok: true }))
		.mockImplementationOnce(async () =>
			Response.json({ ok: false }, { status: 429 }),
		);
	const log = vi.spyOn(console, "error").mockImplementation(() => {});
	await deliverOrderNotification();
	expect(state.updates).toContainEqual({ nextMessage: 1 });
	expect(state.updates).toContainEqual({
		leaseUntil: null,
		nextAttemptAt: expect.any(Date),
	});
	expect(state.updates.some((row) => row.sentAt)).toBe(false);
	expect(log.mock.calls.flat().join(" ")).not.toContain("secret-test-token");
	log.mockRestore();
	state.rows.push([{ ...job, nextMessage: 1, attempts: 1 }], [order], [draft]);
	state.fetch.mockClear();
	await deliverOrderNotification();
	expect(state.fetch).toHaveBeenCalledTimes(1);
	expect(state.fetch.mock.calls[0]?.[0]).toContain("/sendDocument");
});
it("does nothing when no queue job is eligible", async () => {
	state.rows.push([]);
	expect(await deliverOrderNotification()).toBe(false);
	expect(state.fetch).not.toHaveBeenCalled();
});
