import { useIsMutating } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { minBy, uniq } from "es-toolkit";
import { type ReactNode, useState } from "react";
import { cartKeys, useCartApi } from "#/components/cart/cart-provider";
import { isOnSale, Price } from "#/components/product/price";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { FieldLegend, FieldSet } from "#/components/ui/field";
import { Spinner } from "#/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { getProductFn } from "#/lib/product.functions";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/product/$slug")({
	loader: async ({ params }) => {
		const product = await getProductFn({ data: params.slug });
		if (!product) throw notFound();
		return product;
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: loaderData ? `${loaderData.name} | 2o` : "2o" },
			...(loaderData?.description
				? [{ name: "description", content: loaderData.description }]
				: []),
		],
	}),
	remountDeps: ({ params }) => params.slug,
	component: ProductView,
});

type Option = {
	value: string;
	label: string;
	soldOut?: boolean;
	ariaLabel?: string;
};

function OptionGroup({
	legend,
	value,
	options,
	onChange,
	className,
}: {
	legend: ReactNode;
	value?: string;
	options: Option[];
	onChange: (value?: string) => void;
	className?: string;
}) {
	return (
		<FieldSet>
			<FieldLegend variant="label">{legend}</FieldLegend>
			<ToggleGroup
				variant="outline"
				spacing={2}
				className={cn("flex-wrap", className)}
				value={value ? [value] : []}
				onValueChange={([next]) => onChange(next)}
			>
				{options.map((o) => (
					<ToggleGroupItem
						key={o.value}
						value={o.value}
						disabled={o.soldOut}
						aria-label={o.ariaLabel}
						className={cn(o.soldOut && "line-through")}
					>
						{o.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</FieldSet>
	);
}

function ProductView() {
	const product = Route.useLoaderData();
	const { addItem } = useCartApi();
	const adding = useIsMutating({ mutationKey: cartKeys.add }) > 0;

	const colors = uniq(product.skus.map((s) => s.color));
	const [color, setColor] = useState(
		product.skus.find((s) => s.inStock)?.color ?? colors[0],
	);
	const [skuId, setSkuId] = useState<string>();

	const colorSkus = product.skus.filter((s) => s.color === color);
	const selected = colorSkus.find((s) => s.id === skuId);
	const shown =
		selected ??
		minBy(
			colorSkus.filter((s) => s.inStock),
			(s) => s.price,
		) ??
		colorSkus[0];

	return (
		<div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
			<div className="aspect-square overflow-hidden rounded-xl bg-muted">
				<img
					src={colorSkus.find((s) => s.imageUrl)?.imageUrl ?? undefined}
					alt={`${product.name}, ${color}`}
					className="size-full object-cover"
				/>
			</div>

			<div className="flex flex-col gap-6">
				<div>
					{product.brand && (
						<p className="text-muted-foreground text-sm">{product.brand}</p>
					)}
					<h1 className="font-bold text-3xl tracking-tight">{product.name}</h1>
					{shown && (
						<p className="mt-2 flex items-center gap-2 text-xl">
							<span className="font-semibold">
								{!selected && "From "}
								<Price
									price={shown.price}
									originalPrice={shown.originalPrice}
									currency={product.currency}
								/>
							</span>
							{isOnSale(shown.price, shown.originalPrice) && (
								<Badge>Sale</Badge>
							)}
						</p>
					)}
				</div>

				{shown ? (
					<>
						{colors.length > 1 && (
							<OptionGroup
								legend={
									<>
										Color:{" "}
										<span className="font-normal capitalize">{color}</span>
									</>
								}
								className="capitalize"
								value={color}
								options={colors.map((c) => ({ value: c, label: c }))}
								onChange={(next) => next && setColor(next)}
							/>
						)}

						<OptionGroup
							legend="Size"
							value={selected?.id}
							options={colorSkus.map((s) => ({
								value: s.id,
								label: s.size,
								soldOut: !s.inStock,
								ariaLabel: `Size ${s.size}${s.inStock ? "" : ", sold out"}`,
							}))}
							onChange={setSkuId}
						/>

						<Button
							size="lg"
							disabled={!selected || adding}
							onClick={() => selected && addItem(selected.id)}
						>
							{adding && <Spinner />}
							{selected ? "Add to cart" : "Select a size"}
						</Button>
					</>
				) : (
					<p className="text-muted-foreground">
						This product is currently unavailable.
					</p>
				)}

				{product.description && (
					<p className="max-w-prose text-muted-foreground">
						{product.description}
					</p>
				)}
			</div>
		</div>
	);
}
