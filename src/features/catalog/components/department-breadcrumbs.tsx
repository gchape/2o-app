import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import {
	type Category,
	categories,
	type Department,
	departments,
} from "#/data/catalog";

type DepartmentBreadcrumbsProps = {
	department: Department;
	category?: Category;
};

export function DepartmentBreadcrumbs({
	department,
	category,
}: DepartmentBreadcrumbsProps) {
	const departmentLabel = departments[department].label;

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to="/">Home</Link>} />
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					{category ? (
						<BreadcrumbLink
							render={
								<Link to="/$department" params={{ department }}>
									{departmentLabel}
								</Link>
							}
						/>
					) : (
						<BreadcrumbPage>{departmentLabel}</BreadcrumbPage>
					)}
				</BreadcrumbItem>
				{category && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{categories[category].label}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
