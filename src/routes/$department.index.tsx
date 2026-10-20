import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { type Product, ProductCard } from "#/components/product/product-card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";

const allProducts: Product[] = [
	{
		id: "1",
		name: "Classic Sneaker",
		price: 89,
		image: "https://picsum.photos/seed/sneaker/600",
		department: "men",
		category: "shoes",
		badge: "New",
	},
	{
		id: "2",
		name: "Heavyweight Hoodie",
		price: 64,
		image: "https://picsum.photos/seed/hoodie/600",
		department: "men",
		category: "hoodies",
	},
	{
		id: "3",
		name: "Running Shoe",
		price: 99,
		image: "https://picsum.photos/seed/runner/600",
		department: "women",
		category: "shoes",
	},
];

export const getProducts = createServerFn({ method: "GET" })
	.validator((data: { department: string; category?: string }) => data)
	.handler(async ({ data }) => {
		return allProducts.filter(
			(p) =>
				p.department === data.department &&
				(!data.category || p.category === data.category),
		);
	});

export const Route = createFileRoute("/$department/")({
	loader: ({ params }) => getProducts({ data: params }),
	component: DepartmentPage,
});

function DepartmentPage() {
	const { department } = Route.useParams();
	const products = Route.useLoaderData();

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList className="capitalize">
					<BreadcrumbItem>
						<BreadcrumbLink render={<Link to="/">Home</Link>} />
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{department}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{products.length === 0 ? (
				<p className="py-10 text-muted-foreground">No products yet.</p>
			) : (
				<div className="grid grid-cols-2 gap-4 py-6 md:grid-cols-3 lg:grid-cols-4">
					{products.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>
			)}
		</>
	);
}
