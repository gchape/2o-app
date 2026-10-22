import {
	formatPrice,
	useCartApi,
	useCartState,
} from "#/components/cart/cart-provider";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { MAX_QUANTITY } from "#/lib/cart.types";

export function CartDrawer() {
	const { items, isOpen, subtotal, currency } = useCartState();
	const { setOpen, setQuantity, removeItem } = useCartApi();

	return (
		<Sheet open={isOpen} onOpenChange={setOpen}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 sm:max-w-md"
			>
				<SheetHeader>
					<SheetTitle>Your cart</SheetTitle>
				</SheetHeader>

				{items.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
						<p className="font-medium">Your cart is empty</p>
						<p className="text-muted-foreground text-sm">
							Add some deals and they will show up here.
						</p>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Continue shopping
						</Button>
					</div>
				) : (
					<ul className="flex-1 divide-y overflow-y-auto px-4">
						{items.map((item) => (
							<li key={item.id} className="flex gap-4 py-4">
								{item.image ? (
									<img
										src={item.image}
										alt={item.name}
										className="size-20 shrink-0 rounded-md bg-muted object-cover"
									/>
								) : (
									<div className="size-20 shrink-0 rounded-md bg-muted" />
								)}
								<div className="flex min-w-0 flex-1 flex-col">
									<div className="flex justify-between gap-2">
										<p className="truncate font-medium">{item.name}</p>
										<p className="font-semibold">
											{formatPrice(item.price * item.quantity, item.currency)}
										</p>
									</div>
									<p className="text-muted-foreground text-sm">
										{formatPrice(item.price, item.currency)} each
									</p>
									<div className="mt-auto flex items-center justify-between pt-2">
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="icon-sm"
												aria-label={`Decrease quantity of ${item.name}`}
												onClick={() => setQuantity(item.id, item.quantity - 1)}
											>
												−
											</Button>
											<span className="w-6 text-center text-sm">
												{item.quantity}
											</span>
											<Button
												variant="outline"
												size="icon-sm"
												aria-label={`Increase quantity of ${item.name}`}
												disabled={item.quantity >= MAX_QUANTITY}
												onClick={() => setQuantity(item.id, item.quantity + 1)}
											>
												+
											</Button>
										</div>
										<button
											type="button"
											className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
											onClick={() => removeItem(item.id)}
										>
											Remove
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}

				{items.length > 0 && (
					<SheetFooter className="border-t">
						<div className="flex items-center justify-between font-semibold text-lg">
							<span>Subtotal</span>
							<span>{formatPrice(subtotal, currency)}</span>
						</div>
						<p className="text-muted-foreground text-xs">
							Shipping and taxes are calculated at checkout.
						</p>
						{/* Link this to your checkout route once it exists */}
						<Button size="lg" className="w-full">
							Checkout
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
