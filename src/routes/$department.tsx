import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { departments } from "#/lib/site";

export const Route = createFileRoute("/$department")({
	beforeLoad: ({ params }) => {
		if (!departments.some((d) => d.slug === params.department)) {
			throw notFound();
		}
	},
	component: () => (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<Outlet />
		</div>
	),
});
