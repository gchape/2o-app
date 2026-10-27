import { expect, it } from "vitest";
import { calculateQuote } from "./checkout-quote.server";
import { orderMessages } from "./telegram-message";

it.each([false, true])(
	"formats current and legacy snapshots, escaping and chunking customer text (legacy: %s)",
	(legacy) => {
		const quote = calculateQuote(
			Array.from({ length: 50 }, (_, i) => ({
				id: String(i),
				name: '<b>Fake</b> & "Shoes" '.repeat(30),
				price: 10000,
				currency: "USD",
				quantity: 1,
				image: null,
				shipping: {
					groupId: "store-a",
					rule: { flatRateUsd: 700, freeFromUsd: 9900 },
					estimatedUnitUsd: null,
				},
			})),
			{
				gelPerUsd: 2.7,
				rateDate: "2026-10-26T00:00:00Z",
				serviceFeeBps: 500,
				shippingUsd: 700,
				iban: "GE29NB0000000101904917",
			},
		);
		const {
			totalGel,
			pricing: { rateDate, ...oldPricing },
			...oldQuote
		} = quote;
		const messages = orderMessages({
			id: "order-id",
			name: "<b>Buyer</b>",
			email: "buyer@example.com",
			createdAt: new Date("2026-10-26T12:00:00Z"),
			quote: legacy
				? {
						...oldQuote,
						paymentTotal: totalGel,
						pricing: {
							...oldPricing,
							paymentCurrency: "GEL",
							rateUpdatedAt: rateDate,
						},
					}
				: quote,
			address: {
				fullName: "Buyer",
				phone: "1234567",
				line1: "123 Main",
				line2: "",
				city: "Wilmington",
				state: "DE",
				postalCode: "19804",
				country: "US",
			},
		});
		expect(messages.length).toBeGreaterThan(1);
		expect(messages.every((m) => m.length <= 3500)).toBe(true);
		const text = messages.join("\n");
		expect(text).toContain("&lt;b&gt;Buyer&lt;/b&gt;");
		expect(text).not.toContain("<b>Fake</b>");
		expect(text).toContain("Service fee (5%): $250.00 USD");
		expect(text).toContain("Total: $5250.00 USD");
		expect(text).toContain(
			"Customer may pay either $5250.00 USD or 14175.00 GEL",
		);
		expect(text).toContain("Exchange rate at quote: 1 USD = 2.7 GEL");
		expect(text).toContain("U.S. shipping: FREE");
		expect(text).toContain("Payment awaiting verification");
		expect(text).toContain("buyer@example.com");
		expect(text).toContain("2026-10-26T12:00:00.000Z");
	},
);
