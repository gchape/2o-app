import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { SiteLayout } from "#/components/layout/site-layout";
import { Providers } from "#/components/providers";
import { site } from "#/data/site";
import { publicConfigQuery } from "#/features/config/config.queries";
import { chatWidgetScript } from "#/lib/chat-widget";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	loader: ({ context }) => context.queryClient.query(publicConfigQuery),
	head: ({ loaderData }) => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: `${site.name} | ${site.tagline}` },
			{ name: "description", content: site.description },
		],
		links: [
			{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
			{ rel: "apple-touch-icon", href: "/apple-icon-180x180.png" },
			{ rel: "stylesheet", href: appCss },
		],
		scripts: loaderData?.chatEmbedUrl
			? [chatWidgetScript(loaderData.chatEmbedUrl)]
			: [],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
});

function RootLayout() {
	return (
		<Providers>
			<SiteLayout>
				<Outlet />
			</SiteLayout>
		</Providers>
	);
}

// Keep the document independent of loader data so root errors can render.
function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className="scrollbar-gutter-stable">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{ position: "bottom-left" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
