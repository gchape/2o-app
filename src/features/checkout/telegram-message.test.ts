import { expect, it } from "vitest";
import { calculateQuote } from "./checkout";
import { orderMessages } from "./telegram-message";

it("includes the order breakdown, escapes customer text and chunks large orders", () => {
	const quote = calculateQuote(
		Array.from({ length: 50 }, (_, i) => ({
			id: String(i),
			name: '<b>Fake</b> & "Shoes" '.repeat(30),
			price: 10000,
			currency: "USD",
			quantity: 1,
			image: null,
		})),
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
	const messages = orderMessages({
		id: "order-id",
		name: "<b>Buyer</b>",
		email: "buyer@example.com",
		createdAt: new Date("2026-10-26T12:00:00Z"),
		quote,
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
	expect(text).toContain("U.S. shipping: FREE");
	expect(text).toContain("Payment awaiting verification");
	expect(text).toContain("buyer@example.com");
	expect(text).toContain("2026-10-26T12:00:00.000Z");
});
