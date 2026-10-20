import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "#/components/ui/button";
import { useCartApi, useCartState } from "#/lib/cart";

export function CartButton() {
	const { count } = useCartState();
	const { setOpen } = useCartApi();

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			className="relative"
			aria-label={`Open cart, ${count} items`}
			onClick={() => setOpen(true)}
		>
			<HugeiconsIcon icon={ShoppingCart01Icon} size={20} />
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
