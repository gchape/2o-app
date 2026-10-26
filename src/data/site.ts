/** Storefront-wide settings and copy. Everything market- or brand-specific lives here. */
export const site = {
	name: "2o",

	/** ISO 4217 code used when a product or cart has no currency of its own. */
	currency: "GEL",

	/** IANA zone the store operates in; times shown to shoppers use it. */
	timezone: "Asia/Tbilisi",

	delivery: {
		region: "United States",
		currency: "USD",
		/** Free U.S. delivery from this merchandise subtotal, in USD cents. */
		freeFrom: 9_900,
	},

	tagline: "Big brands. Small prices.",
	description:
		"Daily deals on shoes and clothing for men, women and kids, checked across wholesale stores.",
	pitch:
		"Discover shoes and clothing from wholesale stores, compare listed prices, and find something for the whole family.",
	heroPitch:
		"Discover shoes and clothing for the whole family. Compare the deals, find your fit, and spend less time searching.",
};
