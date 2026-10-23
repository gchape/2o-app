import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { Container } from "#/components/layout/container";
import { DepartmentBreadcrumbs } from "#/features/catalog/components/department-breadcrumbs";
import {
	categorySchema,
	departmentSchema,
} from "#/features/catalog/product.schema";
import { parseParam } from "#/lib/route-guards";

export const Route = createFileRoute("/$department")({
	beforeLoad: ({ params }) => ({
		department: parseParam(departmentSchema, params.department),
	}),
	component: DepartmentLayout,
});

function DepartmentLayout() {
	const { department } = Route.useRouteContext();
	const { category } = useParams({ strict: false });

	return (
		<Container className="py-6">
			<DepartmentBreadcrumbs
				department={department}
				category={categorySchema.safeParse(category).data}
			/>
			<Outlet />
		</Container>
	);
}
