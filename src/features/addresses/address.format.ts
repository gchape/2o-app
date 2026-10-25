import type { Address } from "./address.functions";

/** Street details followed by city, state, ZIP, and country. */
export function formatAddress(
	address: Pick<
		Address,
		"line1" | "line2" | "city" | "state" | "postalCode" | "country"
	>,
) {
	return {
		street: [address.line1, address.line2].filter(Boolean).join(", "),
		locality: [
			address.city,
			[address.state, address.postalCode].filter(Boolean).join(" "),
			address.country,
		]
			.filter(Boolean)
			.join(", "),
	};
}
