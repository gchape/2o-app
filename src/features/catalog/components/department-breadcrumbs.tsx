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
import { useTranslation } from "#/i18n/translate";

type DepartmentBreadcrumbsProps = {
	department: Department;
	category?: Category;
};

export function DepartmentBreadcrumbs({
	department,
	category,
}: DepartmentBreadcrumbsProps) {
	const t = useTranslation();
	const departmentLabel = t(departments[department].label);

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to="/">{t("Home")}</Link>} />
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					{category ? (
						<BreadcrumbLink
							render={
								<Link
									to="/$department/{-$category}"
									params={{ department, category: undefined }}
								>
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
							<BreadcrumbPage>{t(categories[category].label)}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
