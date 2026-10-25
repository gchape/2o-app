import type { Address } from "./address.functions";

/** The two lines an address is shown on: street and apartment, then postcode, city and country. */
export function formatAddress(
	address: Pick<Address, "line1" | "line2" | "city" | "postalCode" | "country">,
) {
	const street = [address.line1, address.line2].filter(Boolean).join(", ");
	const city = [address.postalCode, address.city].filter(Boolean).join(" ");
	return {
		street,
		locality: [city, address.country].filter(Boolean).join(", "),
	};
}
