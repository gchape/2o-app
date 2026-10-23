import { site } from "#/data/site";

/** `pageTitle("Women", "Shoes")` → `"Women | Shoes | 2o"`. */
export const pageTitle = (...parts: Array<string | undefined>) =>
	[...parts.filter(Boolean), site.name].join(" | ");

/** For pages that should never show up in search results. */
export const noIndexMeta = { name: "robots", content: "noindex" } as const;
