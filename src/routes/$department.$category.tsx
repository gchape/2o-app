import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { categories, departments } from "#/data/catalog";
import { CatalogListing } from "#/features/catalog/components/catalog-listing";
import { categorySchema } from "#/features/catalog/product.schema";
import { loadCatalog } from "#/features/search/catalog.queries";
import {
	catalogFiltersSchema,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import { parseParam } from "#/lib/route-guards";
import { pageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$department/$category")({
	beforeLoad: ({ params }) => ({
		category: parseParam(categorySchema, params.category),
	}),
	validateSearch: catalogFiltersSchema,
	search: { middlewares: [stripSearchParams(DEFAULT_FILTERS)] },
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		loadCatalog(
			context.queryClient,
			{
				department: context.department,
				category: context.category,
				mode: "listing",
			},
			deps.search,
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
	const filters = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<CatalogListing
			scope={{ department, category, mode: "listing" }}
			filters={filters}
			onFiltersChange={(search) =>
				navigate({ search, replace: true, resetScroll: false })
			}
		/>
	);
}
