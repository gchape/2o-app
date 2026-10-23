import { createFileRoute } from "@tanstack/react-router";
import { departments } from "#/data/catalog";
import { ProductListing } from "#/features/catalog/components/product-listing";
import { productsQuery } from "#/features/catalog/product.queries";
import { pageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$department/")({
	loader: ({ context }) =>
		context.queryClient.infiniteQuery(productsQuery(context.department)),
	head: ({ match }) => ({
		meta: [{ title: pageTitle(departments[match.context.department].label) }],
	}),
	component: DepartmentPage,
});

function DepartmentPage() {
	const { department } = Route.useRouteContext();

	return <ProductListing department={department} />;
}
