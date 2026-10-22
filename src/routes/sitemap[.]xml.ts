import { createFileRoute } from "@tanstack/react-router";
import { escape as escapeXml } from "es-toolkit";
import { departmentSlugs } from "#/data/departments";
import { db } from "#/db";
import { product } from "#/db/schema";
import { env } from "#/lib/env.server";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const rows = await db.select({ slug: product.slug }).from(product);

				const paths = [
					"/",
					...departmentSlugs.map((d) => `/${d}`),
					...rows.map((r) => `/product/${encodeURIComponent(r.slug)}`),
				];

				const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escapeXml(env.SITE_URL + p)}</loc></url>`).join("\n")}
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
