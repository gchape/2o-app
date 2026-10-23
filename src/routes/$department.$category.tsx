import { createFileRoute } from "@tanstack/react-router";
import { categories, departments } from "#/data/catalog";
import { ProductListing } from "#/features/catalog/components/product-listing";
import { productsQuery } from "#/features/catalog/product.queries";
import { categorySchema } from "#/features/catalog/product.schema";
import { parseParam } from "#/lib/route-guards";
import { pageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$department/$category")({
	beforeLoad: ({ params }) => ({
		category: parseParam(categorySchema, params.category),
	}),
	loader: ({ context }) =>
		context.queryClient.infiniteQuery(
			productsQuery(context.department, context.category),
		),
	head: ({ match }) => {
		const { department, category } = match.context;
		return {
			meta: [
				{
					title: pageTitle(
						`${departments[department].label} ${categories[category].label.toLowerCase()}`,
					),
				},
			],
		};
	},
	component: CategoryPage,
});

function CategoryPage() {
	const { department, category } = Route.useRouteContext();

	return <ProductListing department={department} category={category} />;
}
