import { viewPaths } from "@better-auth-ui/core";
import { useAuthenticate } from "@better-auth-ui/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "#/components/auth/settings/settings";
import { authClient } from "#/features/auth/auth.client";
import { noIndexMeta, pageTitle } from "#/lib/seo";

const validPaths = new Set<string>(Object.values(viewPaths.settings));

export const Route = createFileRoute("/settings/$path")({
	beforeLoad: ({ params }) => {
		if (!validPaths.has(params.path)) throw notFound();
	},
	head: () => ({
		meta: [{ title: pageTitle("Settings") }, noIndexMeta],
	}),
	component: () => {
		const { path } = Route.useParams();
		const { data: session } = useAuthenticate(authClient);

		if (!session) {
			return (
				<p className="px-4 py-12 text-center text-muted-foreground">Loading…</p>
			);
		}

		return (
			<div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
				<Settings path={path} />
			</div>
		);
	},
});
