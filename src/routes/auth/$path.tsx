import { viewPaths } from "@better-auth-ui/core";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Auth } from "#/components/auth/auth";
import { noIndexMeta, pageTitle } from "#/lib/seo";

const validPaths = new Set<string>(Object.values(viewPaths.auth));

export const Route = createFileRoute("/auth/$path")({
	beforeLoad: ({ params }) => {
		if (!validPaths.has(params.path)) throw redirect({ to: "/" });
	},
	head: () => ({
		meta: [{ title: pageTitle("Sign in") }, noIndexMeta],
	}),
	component: () => (
		<div className="flex justify-center px-4 py-12 md:py-20">
			<Auth path={Route.useParams().path} />
		</div>
	),
});
