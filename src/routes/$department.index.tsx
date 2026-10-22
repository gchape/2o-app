import { createFileRoute } from "@tanstack/react-router";
import { capitalize } from "es-toolkit";
import { ProductGrid } from "#/components/product/product-grid";
import { getProductsFn } from "#/lib/product.functions";

export const Route = createFileRoute("/$department/")({
	loader: ({ context }) =>
		getProductsFn({ data: { department: context.department } }),
	head: ({ params }) => ({
		meta: [{ title: `${capitalize(params.department)} | 2o` }],
	}),
	component: DepartmentPage,
});

function DepartmentPage() {
	return <ProductGrid products={Route.useLoaderData()} />;
}
