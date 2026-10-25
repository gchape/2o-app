import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { Container } from "#/components/layout/container";
import {
	categories,
	categorySchema,
	departmentSchema,
	departments,
} from "#/data/catalog";
import { site } from "#/data/site";
import { CatalogListing } from "#/features/catalog/components/catalog-listing";
import { DepartmentBreadcrumbs } from "#/features/catalog/components/department-breadcrumbs";
import { loadCatalog } from "#/features/search/catalog.queries";
import {
	catalogFiltersSchema,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import { translate as t } from "#/i18n/translate";
import { parseParam } from "#/lib/route-guards";

export const Route = createFileRoute("/$department/{-$category}")({
	beforeLoad: ({ params, context }) => {
		const department = parseParam(departmentSchema, params.department);
		const category = parseParam(categorySchema.optional(), params.category);
		return {
			scope: { department, category, mode: "listing" as const },
			title: category
				? t(
						`${departments[department].label} ${categories[category].label.toLowerCase()}`,
						{},
						context.locale,
					)
				: t(departments[department].label, {}, context.locale),
		};
	},
	validateSearch: catalogFiltersSchema,
	search: { middlewares: [stripSearchParams(DEFAULT_FILTERS)] },
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		loadCatalog(context.queryClient, context.scope, deps.search),
	head: ({ match }) => ({
		meta: [{ title: `${match.context.title} | ${site.name}` }],
	}),
	component: DepartmentPage,
});

function DepartmentPage() {
	const { scope, title } = Route.useRouteContext();
	const filters = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<Container className="py-8 md:py-12">
			<DepartmentBreadcrumbs
				department={scope.department}
				category={scope.category}
			/>
			<h1 className="type-title mt-7 text-3xl md:text-5xl">{title}</h1>
			<CatalogListing
				key={`${scope.department}/${scope.category ?? ""}`}
				scope={scope}
				filters={filters}
				onFiltersChange={(search) =>
					navigate({ search, replace: true, resetScroll: false })
				}
			/>
		</Container>
	);
}
