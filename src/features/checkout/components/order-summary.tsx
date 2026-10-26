import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import { site } from "#/data/site";
import type { CartItem } from "#/features/cart/cart";
import type { useCart } from "#/features/cart/use-cart";
import { ProductImage } from "#/features/catalog/components/product-image";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";
import type { CheckoutQuote } from "../checkout";

function OrderItems({ items }: { items: CartItem[] }) {
	const { formatPrice } = usePriceFormatter();
	return (
		<ul className="divide-y">
			{items.map((item) => (
				<li key={item.id} className="flex gap-3 py-4 first:pt-0">
					<ProductImage
						compact
						src={item.image}
						alt=""
						className="size-14 shrink-0 rounded-lg bg-muted"
					/>
					<div className="min-w-0 flex-1 text-sm">
						<p className="wrap-anywhere font-medium leading-snug">
							{item.name}
						</p>
						<div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<p className="text-xs text-muted-foreground">
								{item.quantity} × {formatPrice(item.price, item.currency)}
							</p>
							<p className="font-semibold tabular-nums">
								{formatPrice(item.price * item.quantity, item.currency)}
							</p>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}

export function OrderSummary({ quote }: { quote: CheckoutQuote }) {
	const t = useTranslation();
	const { formatPrice } = usePriceFormatter();
	const usd = (value: number) => formatPrice(value, "USD");
	return (
		<div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
			<h2 className="type-title text-xl">{t("Order summary")}</h2>
			<OrderItems
				items={quote.lines.map((line) => ({
					...line,
					price: line.usdPrice,
					currency: "USD",
				}))}
			/>
			<dl className="space-y-3 border-t pt-4 text-sm [&>div]:flex [&>div]:flex-wrap [&>div]:justify-between [&>div]:gap-x-3 [&>div]:gap-y-1 [&_dd]:font-medium [&_dd]:tabular-nums">
				<div>
					<dt>{t("Items (USD)")}</dt>
					<dd>{usd(quote.subtotalUsd)}</dd>
				</div>
				<div>
					<dt>
						{t("Service fee ({{percent}}%)", {
							percent: quote.pricing.serviceFeeBps / 100,
						})}
					</dt>
					<dd>{usd(quote.serviceFeeUsd)}</dd>
				</div>
				<div>
					<dt>{t("U.S. shipping")}</dt>
					<dd className={quote.shippingUsd ? undefined : "text-price"}>
						{quote.shippingUsd ? usd(quote.shippingUsd) : t("Free")}
					</dd>
				</div>
				<div className="border-t pt-4 text-base font-semibold">
					<dt>{t("Total (USD)")}</dt>
					<dd className="type-num text-xl">{usd(quote.totalUsd)}</dd>
				</div>
				<div className="text-muted-foreground">
					<dt>{t("Total in lari (GEL)")}</dt>
					<dd>{formatPrice(quote.totalGel, "GEL")}</dd>
				</div>
			</dl>
			<p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
				{t(
					"Service fee applies to items only. Free U.S. shipping on items totaling {{amount}} or more.",
					{ amount: usd(site.delivery.freeFrom) },
				)}
			</p>
		</div>
	);
}

export function CartSummary({ cart }: { cart: ReturnType<typeof useCart> }) {
	const t = useTranslation();
	const { formatPrice } = usePriceFormatter();
	return (
		<div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
			<h2 className="type-title text-xl">{t("Order summary")}</h2>
			{cart.isPending ? (
				<p role="status">{t("Loading your cart…")}</p>
			) : cart.isError ? (
				<>
					<p role="alert">{t("Couldn't load your cart.")}</p>
					<Button variant="outline" onClick={() => cart.refetch()}>
						{t("Try again")}
					</Button>
				</>
			) : !cart.items.length ? (
				<>
					<p className="text-sm text-muted-foreground">
						{t("Your cart is empty")}
					</p>
					<LinkButton to="/deals" variant="outline">
						{t("All deals")}
					</LinkButton>
				</>
			) : (
				<>
					<OrderItems items={cart.items} />
					<div className="flex flex-wrap justify-between gap-2 border-t pt-4 font-semibold">
						<span>{t("Subtotal")}</span>
						<span>{formatPrice(cart.subtotal, cart.currency)}</span>
					</div>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{t(
							"Review your final total in USD and GEL, including shipping and fees, before you pay.",
						)}
					</p>
				</>
			)}
		</div>
	);
}
