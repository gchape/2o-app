import { QueryClient } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { loadCatalog } from "#/features/search/catalog.queries";
import {
	DEFAULT_FILTERS,
	scopeSchema,
} from "#/features/search/catalog-filters";
import type { Locale } from "#/i18n/locale";
import type { Route as RootRoute } from "#/routes/__root";
import { Route } from "#/routes/stores.$storeId";

vi.mock("#/features/search/catalog.queries", () => ({
	loadCatalog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("#/features/catalog/components/catalog-listing", () => ({
	CatalogListing: () => null,
}));

function routerFor(path: string) {
	const loader: NonNullable<typeof RootRoute.options.loader> = async () => ({
		chatEmbedUrl: null,
		socialProviders: [],
	});
	const root = createRootRouteWithContext<{ queryClient: QueryClient }>()({
		beforeLoad: async (): Promise<{ locale: Locale }> => ({ locale: "en" }),
		loader,
	});
	const store = createRoute({
		getParentRoute: () => root,
		path: "/stores/$storeId",
		beforeLoad: Route.options.beforeLoad,
		validateSearch: Route.options.validateSearch,
		search: Route.options.search,
		loaderDeps: Route.options.loaderDeps,
		loader: Route.options.loader,
	});
	const department = createRoute({
		getParentRoute: () => root,
		path: "/$department/{-$category}",
	});
	return createRouter({
		routeTree: root.addChildren([department, store]),
		context: { queryClient: new QueryClient() },
		history: createMemoryHistory({ initialEntries: [path] }),
	});
}
beforeEach(() => vi.clearAllMocks());

it("loads the anonymous store scope with all available products and validated filters", async () => {
	const storeId = "abcd1234".repeat(8);
	const router = routerFor(`/stores/${storeId}?q=shoes&minPrice=5000`);
	await router.load();
	expect(router.state.matches.at(-1)?.status).toBe("success");
	expect(router.state.matches.at(-1)?.context).toMatchObject({
		title: "Store ABCD1234",
	});
	expect(loadCatalog).toHaveBeenCalledWith(
		expect.any(QueryClient),
		{ mode: "listing", storeId },
		{ ...DEFAULT_FILTERS, q: "shoes", minPrice: 5000 },
	);
});
it.each(["supplier.example", "bad-id", "a".repeat(63)])(
	"rejects %s without querying the catalog",
	async (id) => {
		const router = routerFor(`/stores/${id}`);
		await router.load();
		expect(router.state.matches.at(-1)?.status).toBe("notFound");
		expect(loadCatalog).not.toHaveBeenCalled();
		expect(scopeSchema.safeParse({ storeId: id }).success).toBe(false);
	},
);
it("clearing filters keeps the same store URL", async () => {
	const storeId = "a".repeat(64);
	const router = routerFor(`/stores/${storeId}?q=shoes`);
	await router.load();
	const location = router.buildLocation({
		to: "/stores/$storeId",
		params: { storeId },
		search: DEFAULT_FILTERS,
	});
	expect(location.pathname).toBe(`/stores/${storeId}`);
	expect(location.search).toEqual({});
});
