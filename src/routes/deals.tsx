import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { Container } from "#/components/layout/container";
import { site } from "#/data/site";
import { CatalogListing } from "#/features/catalog/components/catalog-listing";
import { loadCatalog } from "#/features/search/catalog.queries";
import {
	type CatalogScope,
	catalogFiltersSchema,
	DEFAULT_FILTERS,
} from "#/features/search/catalog-filters";
import { priceCheckNote } from "#/features/stats/format-checked-at";
import { statsQuery } from "#/features/stats/stats.queries";
import { useLocale } from "#/i18n/locale";
import { translate as t, useTranslation } from "#/i18n/translate";

const scope: CatalogScope = { mode: "deals" };

export const Route = createFileRoute("/deals")({
	validateSearch: catalogFiltersSchema,
	search: { middlewares: [stripSearchParams(DEFAULT_FILTERS)] },
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ context, deps }) => {
		await Promise.all([
			loadCatalog(context.queryClient, scope, deps.search),
			context.queryClient.query(statsQuery),
		]);
	},
	head: ({ match }) => ({
		meta: [{ title: `${t("Deals", {}, match.context.locale)} | ${site.name}` }],
	}),
	component: DealsPage,
});

function DealsPage() {
	const t = useTranslation();
	const locale = useLocale();
	const filters = Route.useSearch();
	const navigate = Route.useNavigate();
	const { data: stats } = useSuspenseQuery(statsQuery);

	return (
		<Container className="py-10 md:py-14">
			<h1 className="type-title text-3xl md:text-5xl">{t("All deals")}</h1>
			<p className="type-body mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
				{t("Everything on sale right now.")}{" "}
				{priceCheckNote(stats.checkedAt, undefined, locale)}
			</p>

			<CatalogListing
				scope={scope}
				filters={filters}
				onFiltersChange={(search) =>
					navigate({ search, replace: true, resetScroll: false })
				}
				empty={
					<p className="py-10 text-muted-foreground">
						{t(
							"No deals right now. New prices land every morning at {{time}}.",
							{ time: site.priceCheckTime },
						)}
					</p>
				}
			/>
		</Container>
	);
}
