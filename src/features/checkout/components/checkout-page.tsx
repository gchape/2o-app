import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { addressesQuery } from "#/features/addresses/address.queries";
import { AddressDialog } from "#/features/addresses/components/address-dialog";
import { cartQuery } from "#/features/cart/cart.queries";
import { useCart } from "#/features/cart/use-cart";
import { ProductImage } from "#/features/catalog/components/product-image";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";
import { cn } from "#/lib/utils";
import {
	type CheckoutQuote,
	type CheckoutView,
	isUsCountry,
	MAX_PROOF_BYTES,
	PROOF_TYPES,
} from "../checkout";
import {
	type checkoutPageFn,
	prepareCheckoutFn,
	submitCheckoutFn,
	uploadProofFn,
} from "../checkout.functions";

type PageData = Awaited<ReturnType<typeof checkoutPageFn>>;

export function CheckoutPage({ data }: { data: PageData }) {
	const t = useTranslation();
	if (!data.userId)
		return (
			<Container className="max-w-xl space-y-5 py-16 text-center">
				<h1 className="type-title text-3xl">{t("Checkout")}</h1>
				<p className="text-muted-foreground">
					{t("Sign in to save your delivery address and place an order.")}
				</p>
				<LinkButton to="/auth/$path" params={{ path: "sign-in" }}>
					{t("Sign in")}
				</LinkButton>
			</Container>
		);
	return (
		<CheckoutFlow
			key={data.checkout?.id ?? "new"}
			data={data}
			userId={data.userId}
		/>
	);
}

function CheckoutFlow({ data, userId }: { data: PageData; userId: string }) {
	const t = useTranslation();
	const locale = useLocale();
	const { formatPrice } = usePriceFormatter();
	const navigate = useNavigate({ from: "/checkout" });
	const queryClient = useQueryClient();
	const cart = useCart();
	const {
		data: addresses = [],
		isError: addressError,
		refetch: refreshAddresses,
	} = useQuery({ ...addressesQuery(userId), initialData: data.addresses });
	const [addingAddress, setAddingAddress] = useState(false);
	const [addressId, setAddressId] = useState("");
	const [checkout, setCheckout] = useState<CheckoutView | null>(data.checkout);
	const [step, setStep] = useState(
		data.checkout?.proofUploaded ? 3 : data.checkout ? 2 : 1,
	);
	const [requestId, setRequestId] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState("");
	const [now, setNow] = useState(Date.now());
	const prepare = useServerFn(prepareCheckoutFn);
	const upload = useServerFn(uploadProofFn);
	const submit = useServerFn(submitCheckoutFn);
	const selected =
		addresses.find((a) => a.id === addressId) ??
		addresses.find((a) => isUsCountry(a.country));
	const expired = Boolean(checkout && now >= Date.parse(checkout.expiresAt));
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(timer);
	}, []);

	async function action(name: string, task: () => Promise<void>) {
		if (busy) return;
		setBusy(name);
		setError("");
		try {
			await task();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: t("Something went wrong. Please try again."),
			);
		} finally {
			setBusy(null);
		}
	}
	async function copy(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(label);
		} catch {
			setError(t("Couldn't copy. Select and copy the text manually."));
		}
	}

	if (checkout?.submittedAt)
		return (
			<Container className="max-w-3xl space-y-7 py-12 md:py-16">
				<div className="space-y-3 rounded-2xl border bg-price-savings p-6 md:p-8">
					<p className="type-eyebrow text-price">{t("Order received")}</p>
					<h1 className="type-title text-3xl">
						{t("Payment awaiting verification")}
					</h1>
					<p>
						{t(
							"We received your order and payment screenshot. We will verify the bank transfer before processing your order.",
						)}
					</p>
					<p className="text-sm">
						{t("Order ID")}:{" "}
						<span className="break-all font-mono">{checkout.id}</span>
					</p>
					<p className="text-sm">
						{new Date(checkout.submittedAt).toLocaleString(
							languageTags[locale],
						)}
					</p>
				</div>
				<OrderSummary quote={checkout.quote} />
				<LinkButton to="/">{t("Continue shopping")}</LinkButton>
			</Container>
		);

	return (
		<Container className="py-8 md:py-12">
			<div className="mb-8 max-w-2xl space-y-3">
				<p className="type-eyebrow text-muted-foreground">
					{t("U.S. delivery · Bank transfer")}
				</p>
				<h1 className="type-title text-3xl md:text-4xl">{t("Checkout")}</h1>
				<p className="text-sm text-muted-foreground">
					{t(
						"We deliver only to your U.S. address. Delivery to Georgia is not included or available.",
					)}
				</p>
			</div>
			<ol
				aria-label={t("Checkout steps")}
				className="mb-8 grid grid-cols-3 gap-2"
			>
				{["Delivery address", "Bank transfer", "Payment proof"].map(
					(label, index) => (
						<li
							key={label}
							aria-current={step === index + 1 ? "step" : undefined}
							className={cn(
								"flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:text-sm",
								step === index + 1 && "border-brand bg-brand/10",
								step > index + 1 && "border-price/20 bg-price-savings",
							)}
						>
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
								{index + 1}
							</span>
							{t(label)}
						</li>
					),
				)}
			</ol>
			<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
				<section className="min-w-0 space-y-5 rounded-2xl border p-5 sm:p-7">
					{error && (
						<p
							role="alert"
							className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
						>
							{error}
						</p>
					)}
					{step === 1 && (
						<>
							<h2 className="type-title text-xl">
								{t("Choose your U.S. delivery address")}
							</h2>
							{!data.ready && (
								<p role="status" className="rounded-lg bg-muted p-4 text-sm">
									{t(
										"Checkout is temporarily unavailable. Please try again later.",
									)}
								</p>
							)}
							{addressError && (
								<Button variant="outline" onClick={() => refreshAddresses()}>
									{t("Try again")}
								</Button>
							)}
							<fieldset className="space-y-3">
								<legend className="sr-only">{t("Delivery address")}</legend>
								{addresses.map((a) => (
									<label
										key={a.id}
										className={cn(
											"flex cursor-pointer gap-3 rounded-xl border p-4 text-sm",
											selected?.id === a.id && "border-brand bg-brand/5",
											!isUsCountry(a.country) &&
												"cursor-not-allowed opacity-50",
										)}
									>
										<input
											type="radio"
											name="delivery-address"
											value={a.id}
											checked={selected?.id === a.id}
											disabled={!isUsCountry(a.country) || Boolean(busy)}
											onChange={() => {
												setAddressId(a.id);
												setRequestId(null);
											}}
											className="mt-1 accent-current"
										/>
										<span className="min-w-0 wrap-break-word">
											<strong>{a.fullName}</strong>
											<br />
											{a.line1}
											{a.line2 && (
												<>
													<br />
													{a.line2}
												</>
											)}
											<br />
											{a.city}, {a.state} {a.postalCode}
											<br />
											{a.country}
											<br />
											{a.phone}
										</span>
									</label>
								))}
							</fieldset>
							<Button
								variant="outline"
								disabled={Boolean(busy)}
								onClick={() => setAddingAddress(true)}
							>
								{t("Add address")}
							</Button>
							<p className="text-xs text-muted-foreground">
								{t(
									"A U.S. forwarding address is welcome. Include your apartment or forwarding account number.",
								)}
							</p>
							<Button
								className="w-full"
								size="lg"
								disabled={
									!selected ||
									!data.ready ||
									cart.isPending ||
									cart.isError ||
									!cart.items.length ||
									Boolean(busy)
								}
								onClick={() =>
									action("prepare", async () => {
										if (!selected) return;
										const id = requestId ?? crypto.randomUUID();
										setRequestId(id);
										const next = await prepare({
											data: { id, addressId: selected.id },
										});
										setCheckout(next);
										setStep(2);
										await navigate({
											search: { checkout: next.id },
											replace: true,
										});
									})
								}
							>
								{busy === "prepare"
									? t("Preparing checkout…")
									: t("Review total and continue")}
							</Button>
						</>
					)}
					{step === 2 && checkout && (
						<>
							<h2 className="type-title text-xl">
								{t("Transfer the exact amount")}
							</h2>
							<p className="text-sm text-muted-foreground">
								{t(
									"Review the order total, then send a bank transfer using the details below. Include the payment reference.",
								)}
							</p>
							{expired ? (
								<p
									role="alert"
									className="rounded-lg bg-destructive/10 p-4 text-sm"
								>
									{t(
										"These payment instructions have expired. Do not make a new transfer. If you already paid, upload your proof; otherwise start a new checkout.",
									)}
								</p>
							) : (
								<div className="space-y-4 rounded-xl bg-muted/50 p-5">
									<div>
										<p className="text-xs text-muted-foreground">
											{t("Amount to transfer")}
										</p>
										<p className="type-num text-3xl text-price">
											{formatPrice(
												checkout.quote.paymentTotal,
												checkout.quote.pricing.paymentCurrency,
											)}{" "}
											<span className="text-sm">
												{checkout.quote.pricing.paymentCurrency}
											</span>
										</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">
											{t("Beneficiary")}
										</p>
										<p className="font-semibold">
											{checkout.quote.pricing.beneficiary}
										</p>
									</div>
									{[
										["IBAN", checkout.quote.pricing.iban],
										["Payment reference", checkout.id],
									].map(([label, value]) => (
										<div key={label} className="space-y-2">
											<p className="text-xs text-muted-foreground">
												{t(label ?? "")}
											</p>
											<div className="flex flex-wrap items-center gap-2">
												<code className="min-w-0 break-all text-sm select-all">
													{value}
												</code>
												<Button
													variant="outline"
													size="sm"
													onClick={() => copy(value ?? "", label ?? "")}
												>
													{copied === label ? t("Copied") : t("Copy")}
												</Button>
											</div>
										</div>
									))}
									<p className="text-xs text-muted-foreground">
										{t("Payment instructions valid until {{time}}", {
											time: new Date(checkout.expiresAt).toLocaleString(
												languageTags[locale],
											),
										})}
									</p>
								</div>
							)}
							<p className="text-xs text-muted-foreground">
								{t(
									"Send the amount in the currency shown. Any bank transfer charges are paid separately to your bank.",
								)}
							</p>
							<Button className="w-full" size="lg" onClick={() => setStep(3)}>
								{t("I have transferred — upload proof")}
							</Button>
							{expired && (
								<LinkButton to="/checkout" search={{}} variant="outline">
									{t("Start a new checkout")}
								</LinkButton>
							)}
						</>
					)}
					{step === 3 && checkout && (
						<>
							<h2 className="type-title text-xl">
								{t("Upload your payment screenshot")}
							</h2>
							<p className="text-sm text-muted-foreground">
								{t(
									"The screenshot should show the amount, recipient and transfer reference. Hide unrelated balances or transactions.",
								)}
							</p>
							<div className="space-y-3 rounded-xl border border-dashed p-5">
								<label
									htmlFor="payment-proof"
									className="block text-sm font-semibold"
								>
									{t("Payment screenshot")}
								</label>
								<Input
									id="payment-proof"
									type="file"
									accept={PROOF_TYPES.join(",")}
									disabled={Boolean(busy)}
									aria-describedby="proof-help"
									className="h-auto py-3"
									onChange={(event) => {
										const file = event.target.files?.[0];
										if (!file) return;
										if (
											!file.size ||
											file.size > MAX_PROOF_BYTES ||
											!PROOF_TYPES.includes(file.type)
										) {
											setError(t("Use a PNG, JPEG or WebP image up to 2 MB."));
											event.target.value = "";
											return;
										}
										void action("upload", async () => {
											const payload = new FormData();
											payload.set("id", checkout.id);
											payload.set("file", file);
											setCheckout(await upload({ data: payload }));
										});
									}}
								/>
								<p id="proof-help" className="text-xs text-muted-foreground">
									{t("Use a PNG, JPEG or WebP image up to 2 MB.")}
								</p>
								<p role="status" className="text-sm text-price">
									{busy === "upload"
										? t("Uploading…")
										: checkout.proofUploaded
											? t("Payment screenshot uploaded successfully.")
											: t("Upload a screenshot to enable Place order.")}
								</p>
							</div>
							<p className="text-xs text-muted-foreground">
								{t(
									"Your order details and payment proof will be sent to our order team via Telegram for verification.",
								)}
							</p>
							<Button
								className="w-full"
								size="lg"
								disabled={!checkout.proofUploaded || Boolean(busy)}
								onClick={() =>
									action("submit", async () => {
										const confirmed = await submit({
											data: { id: checkout.id },
										});
										setCheckout(confirmed);
										await queryClient.invalidateQueries({
											queryKey: cartQuery.queryKey,
										});
									})
								}
							>
								{busy === "submit" ? t("Placing order…") : t("Place order")}
							</Button>
							<Button
								variant="ghost"
								disabled={Boolean(busy)}
								onClick={() => setStep(2)}
							>
								{t("Back to payment details")}
							</Button>
						</>
					)}
				</section>
				<aside className="min-w-0 lg:sticky lg:top-6">
					{checkout ? (
						<OrderSummary quote={checkout.quote} />
					) : (
						<div className="space-y-4 rounded-2xl border p-5 sm:p-6">
							<h2 className="type-title text-xl">{t("Order summary")}</h2>
							{cart.isPending ? (
								<p>{t("Loading your cart…")}</p>
							) : cart.isError ? (
								<>
									<p role="alert">{t("Couldn't load your cart.")}</p>
									<Button variant="outline" onClick={() => cart.refetch()}>
										{t("Try again")}
									</Button>
								</>
							) : !cart.items.length ? (
								<p>{t("Your cart is empty")}</p>
							) : (
								<>
									{cart.items.map((item) => (
										<div
											key={item.id}
											className="flex justify-between gap-3 text-sm"
										>
											<span>
												{item.quantity} × {item.name}
											</span>
											<span className="shrink-0">
												{formatPrice(item.price * item.quantity, item.currency)}
											</span>
										</div>
									))}
									<div className="flex justify-between border-t pt-4 font-semibold">
										<span>{t("Subtotal")}</span>
										<span>{formatPrice(cart.subtotal, cart.currency)}</span>
									</div>
									<p className="text-xs text-muted-foreground">
										{t(
											"Your USD total, exchange rate, service fee and shipping will be shown before you transfer any money.",
										)}
									</p>
								</>
							)}
						</div>
					)}
					{checkout && (
						<div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm">
							<p className="mb-2 font-semibold">{t("Delivery address")}</p>
							<p>
								{checkout.address.fullName}
								<br />
								{checkout.address.line1}
								<br />
								{checkout.address.line2 && (
									<>
										{checkout.address.line2}
										<br />
									</>
								)}
								{checkout.address.city}, {checkout.address.state}{" "}
								{checkout.address.postalCode}
								<br />
								{t("United States")}
							</p>
						</div>
					)}
				</aside>
			</div>
			<AddressDialog
				open={addingAddress}
				onOpenChange={setAddingAddress}
				firstAddress={!addresses.length}
			/>
		</Container>
	);
}

function OrderSummary({ quote: q }: { quote: CheckoutQuote }) {
	const t = useTranslation();
	const { formatPrice } = usePriceFormatter();
	const usd = (value: number) => formatPrice(value, "USD");
	return (
		<div className="space-y-5 rounded-2xl border p-5 sm:p-6">
			<h2 className="type-title text-xl">{t("Order summary")}</h2>
			<ul className="divide-y">
				{q.lines.map((item) => (
					<li key={item.id} className="flex gap-3 py-3 first:pt-0">
						<ProductImage
							src={item.image}
							alt=""
							className="size-14 shrink-0 rounded-lg"
						/>
						<div className="min-w-0 flex-1 text-sm">
							<p className="wrap-break-word font-medium">{item.name}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{item.quantity} × {usd(item.usdPrice)}
							</p>
						</div>
						<span className="shrink-0 text-sm font-semibold">
							{usd(item.usdTotal)}
						</span>
					</li>
				))}
			</ul>
			<dl className="space-y-3 border-t pt-4 text-sm">
				{q.sourceCurrency === "GEL" && (
					<div className="flex justify-between gap-3 text-muted-foreground">
						<dt>{t("Items (GEL)")}</dt>
						<dd>{formatPrice(q.sourceSubtotal, "GEL")}</dd>
					</div>
				)}
				<div className="flex justify-between gap-3">
					<dt>{t("Items (USD)")}</dt>
					<dd>{usd(q.subtotalUsd)}</dd>
				</div>
				<div className="flex justify-between gap-3">
					<dt>
						{t("Service fee ({{percent}}%)", {
							percent: q.pricing.serviceFeeBps / 100,
						})}
					</dt>
					<dd>{usd(q.serviceFeeUsd)}</dd>
				</div>
				<div className="flex justify-between gap-3">
					<dt>{t("U.S. shipping")}</dt>
					<dd>{q.shippingUsd ? usd(q.shippingUsd) : t("Free")}</dd>
				</div>
				<div className="flex justify-between gap-3 border-t pt-4 text-lg font-semibold">
					<dt>{t("Total (USD)")}</dt>
					<dd className="text-price">{usd(q.totalUsd)}</dd>
				</div>
			</dl>
			<div className="space-y-2 text-xs text-muted-foreground">
				<p>
					{t("Exchange rate: 1 USD = {{rate}} GEL", {
						rate: q.pricing.gelPerUsd,
					})}
				</p>
				<p>
					{t(
						"USD item prices are rounded to cents before quantities are applied.",
					)}
				</p>
				<p>
					{t(
						"The service fee applies to items only. U.S. shipping is free when the item subtotal reaches US$99, before fees.",
					)}
				</p>
			</div>
		</div>
	);
}
