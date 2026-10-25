import { defaultAuthLocale } from "@better-auth-ui/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "#/components/home/hero";
import { georgianAuthLocale } from "./auth-ka";
import { DEFAULT_LOCALE, LocaleProvider } from "./locale";
import { en, ka } from "./messages";
import { storefrontKa } from "./storefront-ka";
import { translate } from "./translate";

function leaves(value: object, prefix = ""): Record<string, string> {
	return Object.fromEntries(
		Object.entries(value).flatMap(([key, child]) => {
			const path = `${prefix}${key}`;
			return typeof child === "string"
				? [[path, child]]
				: Object.entries(leaves(child, `${path}.`));
		}),
	);
}

function placeholders(message: string) {
	return [...message.matchAll(/\{\{(\w+)\}\}/g)]
		.map((match) => match[1])
		.sort();
}

describe("Georgian locale", () => {
	it("covers every auth and app message, preserving interpolation tokens", () => {
		for (const [english, georgian] of [
			[leaves(en), leaves(ka)],
			[
				leaves(defaultAuthLocale.localization),
				leaves(georgianAuthLocale.localization),
			],
		]) {
			expect(Object.keys(georgian ?? {}).sort()).toEqual(
				Object.keys(english ?? {}).sort(),
			);
			for (const [key, value] of Object.entries(english ?? {})) {
				expect(georgian?.[key], key).toBeTruthy();
				expect(placeholders(georgian?.[key] ?? ""), key).toEqual(
					placeholders(value),
				);
			}
		}
		for (const [source, value] of Object.entries(storefrontKa)) {
			expect(placeholders(value), source).toEqual(placeholders(source));
		}
	});

	it("renders the storefront in Georgian by default and supports English overrides", () => {
		const hero = (
			<Hero
				stats={{ deals: 12, warehouses: 2, checkedAt: null }}
				topDiscount={30}
			/>
		);
		expect(DEFAULT_LOCALE).toBe("ka");
		const georgian = renderToStaticMarkup(hero);
		expect(georgian).toContain("ცნობილი ბრენდები.");
		expect(georgian).toContain("დღეს 30%-მდე ფასდაკლება");
		const english = renderToStaticMarkup(
			<LocaleProvider value="en">{hero}</LocaleProvider>,
		);
		expect(english).toContain("Big brands.");
		expect(english).toContain("Up to 30% off today");
	});

	it("leaves catalog names intact and interpolates values literally", () => {
		expect(translate("Nike Air Max")).toBe("Nike Air Max");
		expect(translate("Size {{size}}", { size: "$&" })).toBe("ზომა $&");
		expect(translate("Menu", {}, "en")).toBe("Menu");
	});
});
