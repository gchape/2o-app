import { viewPaths } from "@better-auth-ui/core";
import { useAuthenticate } from "@better-auth-ui/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "#/components/auth/settings/settings";
import { site } from "#/data/site";
import { authClient } from "#/features/auth/auth-client";
import { translate as t, useTranslation } from "#/i18n/translate";

const validPaths = new Set<string>(Object.values(viewPaths.settings));

export const Route = createFileRoute("/settings/$path")({
	beforeLoad: ({ params }) => {
		if (!validPaths.has(params.path)) throw notFound();
	},
	head: ({ match }) => ({
		meta: [
			{ title: `${t("Settings", {}, match.context.locale)} | ${site.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: () => {
		const t = useTranslation();
		const { path } = Route.useParams();
		const { data: session } = useAuthenticate(authClient);

		if (!session) {
			return (
				<p className="px-4 py-12 text-center text-muted-foreground">
					{t("Loading…")}
				</p>
			);
		}

		return (
			<div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 md:py-16">
				<Settings path={path} />
			</div>
		);
	},
});
