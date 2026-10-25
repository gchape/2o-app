import { viewPaths } from "@better-auth-ui/core";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Auth } from "#/components/auth/auth";
import { site } from "#/data/site";

const validPaths = new Set<string>(Object.values(viewPaths.auth));

export const Route = createFileRoute("/auth/$path")({
	beforeLoad: ({ params }) => {
		if (params.path === viewPaths.auth.resetLinkSent) {
			throw redirect({
				to: "/auth/$path",
				params: { path: viewPaths.auth.resetPassword },
			});
		}
		if (!validPaths.has(params.path)) throw redirect({ to: "/" });
	},
	head: () => ({
		meta: [
			{ title: `Sign in | ${site.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: () => (
		<div className="flex justify-center px-5 py-12 sm:px-8 md:py-20">
			<Auth path={Route.useParams().path} />
		</div>
	),
});
