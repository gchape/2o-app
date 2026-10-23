import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { useAddToCart } from "#/features/cart/use-cart";

/** Adds the chosen SKU to the cart; disabled until a size has been picked. */
export function AddToCartButton({ sku }: { sku?: string }) {
	const { addItem, isAdding } = useAddToCart();

	return (
		<Button
			size="lg"
			disabled={!sku || isAdding}
			onClick={() => sku && addItem(sku)}
		>
			{isAdding && <Spinner />}
			{sku ? "Add to cart" : "Select a size"}
		</Button>
	);
}
