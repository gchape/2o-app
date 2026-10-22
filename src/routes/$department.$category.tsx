import { createFileRoute, notFound } from "@tanstack/react-router";
import { capitalize } from "es-toolkit";
import { ProductGrid } from "#/components/product/product-grid";
import { getProductsFn } from "#/lib/product.functions";
import { categorySchema } from "#/lib/product.schema";

export const Route = createFileRoute("/$department/$category")({
	beforeLoad: ({ params }) => {
		const { success, data: category } = categorySchema.safeParse(
			params.category,
		);
		if (!success) throw notFound();
		return { category };
	},
	loader: ({ context }) =>
		getProductsFn({
			data: { department: context.department, category: context.category },
		}),
	head: ({ params }) => ({
		meta: [
			{ title: `${capitalize(params.department)} ${params.category} | 2o` },
		],
	}),
	component: CategoryPage,
});

function CategoryPage() {
	return <ProductGrid products={Route.useLoaderData()} />;
}
