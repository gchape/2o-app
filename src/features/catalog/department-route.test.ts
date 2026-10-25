import { QueryClient } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCatalog } from "#/features/search/catalog.queries";
import { DEFAULT_FILTERS } from "#/features/search/catalog-filters";
import type { Locale } from "#/i18n/locale";
import type { Route as RootRoute } from "#/routes/__root";
import { Route } from "#/routes/$department.{-$category}";

vi.mock("#/features/search/catalog.queries", () => ({
	loadCatalog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("#/features/catalog/components/catalog-listing", () => ({
	CatalogListing: () => null,
}));

function routerFor(path: string, readLocale: () => Locale = () => "ka") {
	const loader: NonNullable<typeof RootRoute.options.loader> = async () => ({
		chatEmbedUrl: null,
		socialProviders: [],
	});
	const root = createRootRouteWithContext<{ queryClient: QueryClient }>()({
		beforeLoad: async () => ({ locale: readLocale() }),
		loader,
	});
	const department = createRoute({
		getParentRoute: () => root,
		path: "/$department/{-$category}",
		beforeLoad: Route.options.beforeLoad,
		validateSearch: Route.options.validateSearch,
		search: Route.options.search,
		loaderDeps: Route.options.loaderDeps,
		loader: Route.options.loader,
	});
	const deals = createRoute({ getParentRoute: () => root, path: "/deals" });
	return createRouter({
		routeTree: root.addChildren([department, deals]),
		context: { queryClient: new QueryClient() },
		history: createMemoryHistory({ initialEntries: [path] }),
	});
}

beforeEach(() => vi.clearAllMocks());

describe("department route", () => {
	it.each([
		["/men", "men", undefined, "მამაკაცები"],
		["/women", "women", undefined, "ქალები"],
		["/kids/shoes", "kids", "shoes", "ბავშვის ფეხსაცმელი"],
		["/women/clothing", "women", "clothing", "ქალის ტანსაცმელი"],
	])(
		"loads %s with its validated scope",
		async (path, department, category, title) => {
			const router = routerFor(path);
			await router.load();
			expect(router.state.matches.at(-1)?.status).toBe("success");
			expect(router.state.matches.at(-1)?.context).toMatchObject({ title });
			expect(loadCatalog).toHaveBeenCalledWith(
				router.options.context?.queryClient,
				{ department, category, mode: "listing" },
				DEFAULT_FILTERS,
			);
		},
	);

	it.each(["/unknown", "/men/unknown"])(
		"returns a 404 for %s",
		async (path) => {
			const router = routerFor(path);
			await router.load();
			expect(router.state.matches.at(-1)?.status).toBe("notFound");
			expect(loadCatalog).not.toHaveBeenCalled();
		},
	);

	it("clears the category when navigating to a department", async () => {
		const router = routerFor("/men/shoes");
		await router.load();
		const location = router.buildLocation({
			to: "/$department/{-$category}",
			params: { department: "women", category: undefined },
		});
		expect(location.pathname).toBe("/women");
	});

	it("keeps static routes ahead of the optional department route", async () => {
		const router = routerFor("/deals");
		await router.load();
		expect(router.state.matches.at(-1)?.routeId).toBe("/deals");
		expect(loadCatalog).not.toHaveBeenCalled();
	});

	it("validates URL filters before loading", async () => {
		const router = routerFor("/men/shoes?q=boots&minPrice=5000");
		await router.load();
		expect(loadCatalog).toHaveBeenCalledWith(
			expect.any(QueryClient),
			{ department: "men", category: "shoes", mode: "listing" },
			{ ...DEFAULT_FILTERS, q: "boots", minPrice: 5000 },
		);
	});

	it("matches existing department URLs with a trailing slash", () => {
		const router = routerFor("/women/");
		expect(router.matchRoutes("/women/").at(-1)).toMatchObject({
			routeId: "/$department/{-$category}",
			params: { department: "women" },
		});
	});
});

it("refreshes localized titles while preserving the current URL and filters", async () => {
	let locale: Locale = "ka";
	const router = routerFor("/men/shoes?q=boots&minPrice=5000", () => locale);
	await router.load();
	const location = router.state.location.href;
	expect(router.state.matches.at(-1)?.context).toMatchObject({
		title: "მამაკაცის ფეხსაცმელი",
	});
	locale = "en";
	await router.invalidate({ sync: true });
	expect(router.state.matches.at(-1)?.context).toMatchObject({
		title: "Men shoes",
	});
	expect(router.state.location.href).toBe(location);
	const reloaded = routerFor(location, () => locale);
	await reloaded.load();
	expect(reloaded.state.matches.at(-1)?.context).toMatchObject({
		title: "Men shoes",
	});
});
