import type { CartItem } from "#/features/cart/cart";

/** USD cents, charged once per warehouse. Null means no free-shipping threshold. */
export type ShippingRule = { flatRateUsd: number; freeFromUsd: number | null };
export type ItemShipping = {
	groupId: string;
	rule: ShippingRule | null;
	/** Cart estimate only; checkout converts again using its frozen rate. */
	estimatedUnitUsd: number | null;
};
export type ShipmentQuote = {
	groupId: string;
	itemIds: string[];
	subtotalUsd: number;
	shippingUsd: number;
	rule: ShippingRule;
};

export function validShippingRule(
	rule: ShippingRule | null | undefined,
): rule is ShippingRule {
	return (
		!!rule &&
		Number.isSafeInteger(rule.flatRateUsd) &&
		rule.flatRateUsd >= 0 &&
		rule.flatRateUsd <= 100_000 &&
		(rule.freeFromUsd === null ||
			(Number.isSafeInteger(rule.freeFromUsd) &&
				rule.freeFromUsd >= 0 &&
				rule.freeFromUsd <= 2_000_000_000))
	);
}

export function shippingCharge(subtotalUsd: number, rule: ShippingRule) {
	return rule.freeFromUsd !== null && subtotalUsd >= rule.freeFromUsd
		? 0
		: rule.flatRateUsd;
}

/** Stable numbering in the drawer, checkout and saved quote; no supplier names. */
export function groupShipments<T extends CartItem>(items: T[]) {
	const groups = new Map<string, T[]>();
	for (const item of items) {
		const id = item.shipping?.groupId ?? `unknown-${item.id}`;
		const group = groups.get(id) ?? [];
		group.push(item);
		groups.set(id, group);
	}
	return [...groups]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([groupId, lines]) => ({ groupId, lines }));
}

export function estimateShipment(items: CartItem[]) {
	const rule = items[0]?.shipping?.rule;
	if (!validShippingRule(rule)) return null;
	let subtotalUsd = 0;
	for (const item of items) {
		const unit = item.shipping?.estimatedUnitUsd;
		if (unit == null || !Number.isSafeInteger(unit) || unit <= 0) return null;
		subtotalUsd += unit * item.quantity;
	}
	return { subtotalUsd, shippingUsd: shippingCharge(subtotalUsd, rule), rule };
}
