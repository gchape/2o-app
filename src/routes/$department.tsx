import {
	createFileRoute,
	Link,
	notFound,
	Outlet,
	useParams,
} from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { departmentSchema } from "#/lib/product.schema";

export const Route = createFileRoute("/$department")({
	beforeLoad: ({ params }) => {
		const parsed = departmentSchema.safeParse(params.department);
		if (!parsed.success) throw notFound();
		return { department: parsed.data };
	},
	component: DepartmentLayout,
});

function DepartmentLayout() {
	const { department } = Route.useParams();
	const { category } = useParams({ strict: false });

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			<Breadcrumb>
				<BreadcrumbList className="capitalize">
					<BreadcrumbItem>
						<BreadcrumbLink render={<Link to="/">Home</Link>} />
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						{category ? (
							<BreadcrumbLink
								render={
									<Link to="/$department" params={{ department }}>
										{department}
									</Link>
								}
							/>
						) : (
							<BreadcrumbPage>{department}</BreadcrumbPage>
						)}
					</BreadcrumbItem>
					{category && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{category}</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>

			<Outlet />
		</div>
	);
}
