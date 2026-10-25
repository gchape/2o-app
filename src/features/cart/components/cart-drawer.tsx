import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { type CartItem, MAX_QUANTITY } from "#/features/cart/cart";
import {
	cartDrawer,
	useCartDrawerOpen,
} from "#/features/cart/cart-drawer.store";
import { useCart, useCartLineActions } from "#/features/cart/use-cart";
import { ProductImage } from "#/features/catalog/components/product-image";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";

export function CartDrawer() {
	const { formatPrice } = usePriceFormatter();
	const t = useTranslation();
	const open = useCartDrawerOpen();
	const { items, subtotal, currency, isPending, isError, isFetching, refetch } =
		useCart();

	return (
		<Sheet open={open} onOpenChange={cartDrawer.actions.set}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 sm:max-w-lg"
			>
				<SheetHeader className="px-6 py-7">
					<SheetTitle className="text-xl font-semibold tracking-tight">
						{t("Your cart")}
					</SheetTitle>
				</SheetHeader>

				{isPending ? (
					<p role="status" className="p-4 text-muted-foreground">
						{t("Loading your cart…")}
					</p>
				) : isError ? (
					<div className="flex flex-col items-start gap-3 p-4">
						<p role="alert">{t("Couldn't load your cart.")}</p>
						<Button
							variant="outline"
							disabled={isFetching}
							onClick={() => refetch()}
						>
							{isFetching ? t("Trying again…") : t("Try again")}
						</Button>
					</div>
				) : items.length === 0 ? (
					<EmptyCart />
				) : (
					<>
						<CartLines items={items} />
						<SheetFooter className="gap-4 border-t p-6">
							<div className="flex items-center justify-between font-semibold text-lg">
								<span>{t("Subtotal")}</span>
								<span>{formatPrice(subtotal, currency)}</span>
							</div>
							<p className="text-muted-foreground text-xs">
								{t("Shipping and taxes are calculated at checkout.")}
							</p>
							<LinkButton
								to="/checkout"
								size="lg"
								className="h-12 w-full rounded-lg"
								onClick={cartDrawer.actions.close}
							>
								{t("Checkout")}
							</LinkButton>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

function EmptyCart() {
	const t = useTranslation();
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
			<p className="font-medium">{t("Your cart is empty")}</p>
			<p className="text-muted-foreground text-sm">
				{t("Add some deals and they will show up here.")}
			</p>
			<Button variant="outline" onClick={cartDrawer.actions.close}>
				{t("Continue shopping")}
			</Button>
		</div>
	);
}

function CartLines({ items }: { items: CartItem[] }) {
	const { formatPrice } = usePriceFormatter();
	const t = useTranslation();
	const { setQuantity, removeItem } = useCartLineActions();

	return (
		<ul className="flex-1 divide-y overflow-y-auto px-6">
			{items.map((item) => (
				<li key={item.id} className="flex gap-4 py-6">
					<ProductImage
						src={item.image}
						alt={item.name}
						className="size-24 shrink-0 rounded-lg"
					/>

					<div className="flex min-w-0 flex-1 flex-col">
						<div className="flex justify-between gap-2">
							<p className="line-clamp-2 text-sm font-medium leading-snug">
								{item.name}
							</p>
							<p className="shrink-0 text-sm font-semibold tabular-nums">
								{formatPrice(item.price * item.quantity, item.currency)}
							</p>
						</div>
						<p className="text-muted-foreground text-sm">
							{t("{{price}} each", {
								price: formatPrice(item.price, item.currency),
							})}
						</p>

						<div className="mt-auto flex items-center justify-between pt-2">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon-sm"
									aria-label={t("Decrease quantity of {{name}}", {
										name: item.name,
									})}
									onClick={() => setQuantity(item.id, item.quantity - 1)}
								>
									−
								</Button>
								<span className="w-6 text-center text-sm">{item.quantity}</span>
								<Button
									variant="outline"
									size="icon-sm"
									aria-label={t("Increase quantity of {{name}}", {
										name: item.name,
									})}
									disabled={item.quantity >= MAX_QUANTITY}
									onClick={() => setQuantity(item.id, item.quantity + 1)}
								>
									+
								</Button>
							</div>
							<Button
								variant="link"
								size="sm"
								type="button"
								className="h-auto p-0 text-muted-foreground hover:text-foreground"
								onClick={() => removeItem(item.id)}
							>
								{t("Remove")}
							</Button>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
