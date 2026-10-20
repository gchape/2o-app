import { viewPaths } from "@better-auth-ui/core";
import { useAuthenticate } from "@better-auth-ui/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "#/components/auth/settings/settings";
import { authClient } from "#/lib/auth-client";

const validPaths = new Set<string>(Object.values(viewPaths.settings));

export const Route = createFileRoute("/settings/$path")({
	beforeLoad: ({ params }) => {
		if (!validPaths.has(params.path)) throw notFound();
	},
	head: () => ({
		meta: [{ title: "Settings | 2o" }, { name: "robots", content: "noindex" }],
	}),
	component: SettingsPage,
});

function SettingsPage() {
	const { path } = Route.useParams();
	// Redirects to sign-in when there is no session, and again if it ends later.
	const { data: session } = useAuthenticate(authClient);

	if (!session) {
		return (
			<p className="px-4 py-12 text-center text-muted-foreground">Loading…</p>
		);
	}

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
			<Settings path={path} />
		</main>
	);
}
