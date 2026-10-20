import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";

export const Route = createFileRoute("/$department/$category")({
	component: CategoryPage,
});

function CategoryPage() {
	const { department, category } = Route.useParams();

	return (
		<Breadcrumb>
			<BreadcrumbList className="capitalize">
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to="/">Home</Link>} />
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink
						render={
							<Link to="/$department" params={{ department }}>
								{department}
							</Link>
						}
					/>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{category}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
