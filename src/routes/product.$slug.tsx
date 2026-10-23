import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { ProductDetails } from "#/features/catalog/components/product-details";
import { getProductFn } from "#/features/catalog/product.functions";
import { resolveSelection } from "#/features/catalog/product-selection";
import { pageTitle } from "#/lib/seo";

/**
 * The chosen color and size live in the URL: links are shareable, the server
 * renders the right variant, and there is no local state to reset between
 * products. Malformed values are dropped rather than rejected.
 */
const searchSchema = z.object({
	color: z.string().optional().catch(undefined),
	sku: z.uuid().optional().catch(undefined),
});

export const Route = createFileRoute("/product/$slug")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const product = await getProductFn({ data: params.slug });
		if (!product) throw notFound();
		return product;
	},
	// Picking a variant only changes the search string; don't refetch for it.
	staleTime: 30_000,
	head: ({ loaderData }) => ({
		meta: [
			{ title: pageTitle(loaderData?.name) },
			...(loaderData?.description
				? [{ name: "description", content: loaderData.description }]
				: []),
		],
	}),
	component: ProductPage,
});

function ProductPage() {
	const product = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<ProductDetails
			product={product}
			selection={resolveSelection(product.skus, search)}
			onColorChange={(color) =>
				navigate({ search: { color }, replace: true, resetScroll: false })
			}
			onSkuChange={(sku) =>
				navigate({
					search: (prev) => ({ ...prev, sku }),
					replace: true,
					resetScroll: false,
				})
			}
		/>
	);
}
