import Decimal from "decimal.js";

export const roundMinorUnits = (amount: Decimal) =>
	amount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();

export const unitPriceUsd = (
	price: number,
	currency: string,
	gelPerUsd: number | null,
) =>
	currency === "USD"
		? price
		: currency === "GEL" && gelPerUsd
			? roundMinorUnits(new Decimal(price).div(gelPerUsd))
			: null;
