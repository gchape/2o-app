import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { departments } from "#/data/catalog";
import { CatalogListing } from "#/features/catalog/components/catalog-listing";
import { loadCatalog } from "#/features/search/catalog.queries";
import {
	catalogFiltersSchema,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import { pageTitle } from "#/lib/seo";

export const Route = createFileRoute("/$department/")({
	// The filters live in the URL: shareable, rendered on the server, no state to reset.
	validateSearch: catalogFiltersSchema,
	search: { middlewares: [stripSearchParams(DEFAULT_FILTERS)] },
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		loadCatalog(
			context.queryClient,
			{ department: context.department, mode: "listing" },
			deps.search,
		),
	head: ({ match }) => ({
		meta: [{ title: pageTitle(departments[match.context.department].label) }],
	}),
	component: DepartmentPage,
});

function DepartmentPage() {
	const { department } = Route.useRouteContext();
	const filters = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<CatalogListing
			scope={{ department, mode: "listing" }}
			filters={filters}
			onFiltersChange={(search) =>
				navigate({ search, replace: true, resetScroll: false })
			}
		/>
	);
}
