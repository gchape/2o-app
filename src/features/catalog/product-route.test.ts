import { QueryClient } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Route as RootRoute } from "#/routes/__root";
import { Route } from "#/routes/product.$slug";
import { getProductFn } from "./product.functions";

vi.mock("./product.functions", () => ({ getProductFn: vi.fn() }));
vi.mock("./components/product-details", () => ({ ProductDetails: () => null }));

beforeEach(() => vi.resetAllMocks());

function routerFor(slug: string) {
	const loader: NonNullable<typeof RootRoute.options.loader> = async () => ({
		chatEmbedUrl: null,
		socialProviders: [],
	});
	const root = createRootRouteWithContext<{ queryClient: QueryClient }>()({
		loader,
	});
	const product = createRoute({
		getParentRoute: () => root,
		path: "/product/$slug",
		loader: Route.options.loader,
	});
	return createRouter({
		routeTree: root.addChildren([product]),
		context: { queryClient: new QueryClient() },
		history: createMemoryHistory({ initialEntries: [`/product/${slug}`] }),
	});
}

describe("product route", () => {
	it("returns a 404 for malformed slugs before calling the server", async () => {
		const router = routerFor("x".repeat(201));
		await router.load();
		expect(router.state.matches.at(-1)?.status).toBe("notFound");
		expect(getProductFn).not.toHaveBeenCalled();
	});

	it("returns a 404 for a missing product", async () => {
		const router = routerFor("missing");
		await router.load();
		expect(router.state.matches.at(-1)?.status).toBe("notFound");
		expect(getProductFn).toHaveBeenCalledWith({
			data: "missing",
			signal: expect.any(AbortSignal),
		});
	});
});
