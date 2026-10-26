import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, exists } from "drizzle-orm";
import { escape as escapeXml } from "es-toolkit";
import { categorySlugs, departmentSlugs } from "#/data/catalog";
import { db } from "#/db";
import { product, skus } from "#/db/schema";
import { env } from "#/server/env.server";

/** Per the sitemap protocol, one file lists at most 50,000 URLs. */
const MAX_SITEMAP_URLS = 50_000;

const staticPaths = [
	"/",
	"/deals",
	"/about",
	...departmentSlugs.flatMap((department) => [
		`/${department}`,
		...categorySlugs.map((category) => `/${department}/${category}`),
	]),
];

const urlEntry = (path: string, lastModified?: Date) =>
	`  <url><loc>${escapeXml(env.SITE_URL + path)}</loc>${
		lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : ""
	}</url>`;

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const products = await db
					.select({ slug: product.slug, updatedAt: product.updatedAt })
					.from(product)
					.where(
						exists(
							db
								.select({ id: skus.id })
								.from(skus)
								.where(
									and(eq(skus.productId, product.id), eq(skus.inStock, true)),
								),
						),
					)
					.orderBy(desc(product.updatedAt))
					.limit(MAX_SITEMAP_URLS - staticPaths.length);

				const entries = [
					...staticPaths.map((path) => urlEntry(path)),
					...products.map((p) =>
						urlEntry(`/product/${encodeURIComponent(p.slug)}`, p.updatedAt),
					),
				];

				const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

				return new Response(xml, {
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
