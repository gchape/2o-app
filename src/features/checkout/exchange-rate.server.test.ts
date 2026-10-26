import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("#/server/redis.server", () => ({ getRedis: async () => redis }));
const { getGelPerUsd, parseNbgRate } = await import("./exchange-rate.server");

const now = Date.parse("2026-10-26T12:00:00Z");
const nbg = (overrides: Record<string, unknown> = {}) => [
	{
		date: "2026-10-26T00:00:00.000Z",
		currencies: [
			{
				code: "USD",
				quantity: 1,
				rate: 2.7,
				validFromDate: "2026-10-26T00:00:00.000Z",
				...overrides,
			},
		],
	},
];

describe("parseNbgRate", () => {
	it("reads the USD rate", () => {
		expect(parseNbgRate(nbg(), now)).toEqual({
			gelPerUsd: 2.7,
			date: "2026-10-26T00:00:00.000Z",
		});
	});

	it("converts to a per-unit rate when NBG quotes several units", () => {
		expect(parseNbgRate(nbg({ quantity: 10, rate: 27 }), now)?.gelPerUsd).toBe(
			2.7,
		);
	});

	it("accepts a rate published for tomorrow or reused over a weekend", () => {
		for (const validFromDate of [
			"2026-10-27T00:00:00.000Z",
			"2026-10-23T00:00:00.000Z",
		]) {
			expect(parseNbgRate(nbg({ validFromDate }), now)).not.toBeNull();
		}
	});

	it("rejects stale, missing, zero and malformed data", () => {
		expect(
			parseNbgRate(nbg({ validFromDate: "2026-10-01T00:00:00.000Z" }), now),
		).toBeNull();
		expect(parseNbgRate(nbg({ validFromDate: "not a date" }), now)).toBeNull();
		expect(parseNbgRate(nbg({ code: "EUR" }), now)).toBeNull();
		expect(parseNbgRate(nbg({ rate: 0 }), now)).toBeNull();
		expect(parseNbgRate(nbg({ rate: 250 }), now)).toBeNull();
		expect(parseNbgRate({}, now)).toBeNull();
		expect(parseNbgRate([], now)).toBeNull();
		expect(
			parseNbgRate(nbg({ validFromDate: "2026-10-29T00:00:00Z" }), now),
		).toBeNull();
		expect(parseNbgRate(nbg({ quantity: 0.5 }), now)).toBeNull();
	});
});

describe("getGelPerUsd", () => {
	const fetchMock = vi.fn();
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(now);
		vi.stubGlobal("fetch", fetchMock);
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("fetches NBG on a cache miss and caches the rate for 15 minutes", async () => {
		redis.get.mockResolvedValue(null);
		fetchMock.mockResolvedValue(Response.json(nbg()));
		expect(await getGelPerUsd()).toEqual({
			gelPerUsd: 2.7,
			date: "2026-10-26T00:00:00.000Z",
		});
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
			"nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD",
		);
		await vi.waitFor(() =>
			expect(redis.set).toHaveBeenCalledWith(
				"checkout:gel-per-usd",
				JSON.stringify({
					gelPerUsd: 2.7,
					date: "2026-10-26T00:00:00.000Z",
				}),
				{ EX: 900 },
			),
		);
	});

	it("serves a cached rate without calling NBG", async () => {
		const cached = { gelPerUsd: 2.65, date: "2026-10-26T00:00:00.000Z" };
		redis.get.mockResolvedValue(JSON.stringify(cached));
		expect(await getGelPerUsd()).toEqual(cached);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each(["2026-10-01T00:00:00Z", "2026-10-29T00:00:00Z", "invalid"])(
		"refreshes cached rates with an unusable date (%s)",
		async (date) => {
			redis.get.mockResolvedValue(JSON.stringify({ gelPerUsd: 2.65, date }));
			fetchMock.mockResolvedValue(Response.json(nbg()));
			expect(await getGelPerUsd()).toEqual({
				gelPerUsd: 2.7,
				date: "2026-10-26T00:00:00.000Z",
			});
			expect(fetchMock).toHaveBeenCalledOnce();
		},
	);

	it("returns null, never a guessed rate, when NBG is unreachable or unusable", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		redis.get.mockResolvedValue(null);
		fetchMock.mockRejectedValueOnce(new Error("network down"));
		expect(await getGelPerUsd()).toBeNull();
		fetchMock.mockResolvedValueOnce(Response.json({}, { status: 500 }));
		expect(await getGelPerUsd()).toBeNull();
		fetchMock.mockResolvedValueOnce(Response.json(nbg({ rate: 0 })));
		expect(await getGelPerUsd()).toBeNull();
		expect(redis.set).not.toHaveBeenCalled();
		log.mockRestore();
	});
});
