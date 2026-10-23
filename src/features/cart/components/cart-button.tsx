import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "#/components/ui/button";
import { cartDrawer } from "#/features/cart/cart-drawer.store";
import { useCart } from "#/features/cart/use-cart";

export function CartButton() {
	const { count } = useCart();

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			className="relative size-10 rounded-xl"
			aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
			onClick={cartDrawer.actions.open}
		>
			<HugeiconsIcon icon={ShoppingBag01Icon} size={20} />
			{count > 0 && (
				<span
					key={count}
					className="fade-in zoom-in-50 absolute -top-1.5 -right-1.5 flex size-5 animate-in items-center justify-center rounded-full bg-brand font-bold text-brand-foreground text-xs ring-2 ring-background duration-200"
				>
					{count}
				</span>
			)}
		</Button>
	);
}
