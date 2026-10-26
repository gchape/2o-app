import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check, CircleCheckIcon } from "#/components/icons";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import { site } from "#/data/site";
import { addressesQuery } from "#/features/addresses/address.queries";
import { AddressDialog } from "#/features/addresses/components/address-dialog";
import { useCart, useCartUpdating } from "#/features/cart/use-cart";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";
import { isUsCountry } from "../checkout";
import type { checkoutPageFn } from "../checkout.functions";
import { useCheckout } from "../use-checkout";
import { CheckoutAddressPicker, DeliveryAddress } from "./checkout-address";
import { CheckoutPayment } from "./checkout-payment";
import { CheckoutProof } from "./checkout-proof";
import { CartSummary, OrderSummary } from "./order-summary";

type PageData = Awaited<ReturnType<typeof checkoutPageFn>>;
const steps = ["Delivery address", "Bank transfer", "Payment proof"];
const stepTitles = [
	"Choose your U.S. delivery address",
	"Transfer the exact amount",
	"Upload your payment screenshot",
];

export function CheckoutPage({ data }: { data: PageData }) {
	const t = useTranslation();
	if (!data.userId)
		return (
			<Container className="max-w-xl space-y-5 py-16 text-center">
				<p className="type-eyebrow text-muted-foreground">
					{t("One step closer to your next find")}
				</p>
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
			key={`${data.userId}:${data.checkout?.id ?? "new"}`}
			data={data}
			userId={data.userId}
		/>
	);
}

function CheckoutFlow({ data, userId }: { data: PageData; userId: string }) {
	const t = useTranslation();
	const locale = useLocale();
	const cart = useCart();
	const cartUpdating = useCartUpdating();
	const {
		data: addresses = [],
		isError: addressError,
		refetch: refreshAddresses,
	} = useQuery({ ...addressesQuery(userId), initialData: data.addresses });
	const [addingAddress, setAddingAddress] = useState(false);
	const [addressId, setAddressId] = useState("");
	const flow = useCheckout(data.checkout);
	const { checkout, step, busy, error } = flow;
	const selected =
		addresses.find((address) => address.id === addressId) ??
		addresses.find(
			(address) => address.isPrimary && isUsCountry(address.country),
		) ??
		addresses.find((address) => isUsCountry(address.country));
	const heading = useRef<HTMLHeadingElement>(null);
	const previousStep = useRef(1);
	const submittedAt = checkout?.submittedAt;
	useEffect(() => {
		if (step !== previousStep.current || submittedAt) heading.current?.focus();
		previousStep.current = step;
	}, [step, submittedAt]);

	if (checkout?.submittedAt)
		return (
			<Container className="max-w-3xl space-y-7 py-12 md:py-16">
				<div className="space-y-4 rounded-2xl border border-price/20 bg-price-savings p-6 sm:p-8">
					<CircleCheckIcon className="size-10 text-price" aria-hidden="true" />
					<p className="type-eyebrow text-price">{t("Order received")}</p>
					<h1
						ref={heading}
						tabIndex={-1}
						className="type-title text-3xl outline-none"
					>
						{t("Payment awaiting verification")}
					</h1>
					<p className="text-sm leading-relaxed">
						{t(
							"We received your order and payment screenshot. We will verify the bank transfer before processing your order.",
						)}
					</p>
					<p className="text-sm">
						{t("Order ID")}:{" "}
						<span className="break-all font-mono select-all">
							{checkout.id}
						</span>
					</p>
					<p className="text-sm text-muted-foreground">
						{new Intl.DateTimeFormat(languageTags[locale], {
							dateStyle: "medium",
							timeStyle: "short",
							timeZone: site.timezone,
						}).format(new Date(checkout.submittedAt))}
					</p>
				</div>
				<OrderSummary quote={checkout.quote} />
				<LinkButton to="/">{t("Continue shopping")}</LinkButton>
			</Container>
		);

	return (
		<Container className="max-w-6xl py-8 md:py-12">
			<div className="mb-8 max-w-2xl space-y-3">
				<p className="type-eyebrow text-muted-foreground">
					{t("U.S. delivery · Bank transfer")}
				</p>
				<h1 className="type-title text-3xl md:text-4xl">{t("Checkout")}</h1>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{t(
						"We deliver only to your U.S. address. Delivery to Georgia is not included or available.",
					)}
				</p>
			</div>
			<ol
				aria-label={t("Checkout steps")}
				className="mb-8 grid grid-cols-3 gap-3 sm:gap-6"
			>
				{steps.map((label, index) => (
					<li
						key={label}
						aria-current={step === index + 1 ? "step" : undefined}
						className={cn(
							"min-w-0 border-t-2 pt-3",
							step === index + 1
								? "border-foreground"
								: step > index + 1
									? "border-price"
									: "border-border",
						)}
					>
						<span
							className={cn(
								"mb-2 flex size-7 items-center justify-center rounded-full text-xs font-semibold",
								step === index + 1
									? "bg-foreground text-background"
									: step > index + 1
										? "bg-price-savings text-price"
										: "bg-muted text-muted-foreground",
							)}
							aria-hidden="true"
						>
							{step > index + 1 ? <Check className="size-4" /> : index + 1}
						</span>
						<span
							className={cn(
								"block wrap-anywhere text-xs leading-relaxed sm:text-sm",
								step === index + 1 ? "font-semibold" : "text-muted-foreground",
							)}
						>
							{t(label)}
						</span>
					</li>
				))}
			</ol>
			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
				<section
					aria-labelledby="checkout-step-title"
					className="min-w-0 space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
				>
					<h2
						id="checkout-step-title"
						ref={heading}
						tabIndex={-1}
						className="type-title scroll-mt-24 text-xl outline-none"
					>
						{t(stepTitles[step - 1] ?? "Checkout")}
					</h2>
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
							<CheckoutAddressPicker
								addresses={addresses}
								selectedId={selected?.id}
								disabled={Boolean(busy)}
								onSelect={setAddressId}
								onAdd={() => setAddingAddress(true)}
							/>
							<Button
								className="h-auto min-h-12 w-full whitespace-normal py-3"
								size="lg"
								disabled={
									!selected ||
									!data.ready ||
									cart.isPending ||
									cart.isError ||
									cartUpdating ||
									!cart.items.length ||
									Boolean(busy)
								}
								onClick={() => selected && flow.prepare(selected.id)}
							>
								{busy === "prepare"
									? t("Preparing checkout…")
									: t("Review total and continue")}
							</Button>
						</>
					)}
					{step === 2 && checkout && (
						<CheckoutPayment
							checkout={checkout}
							onContinue={() => flow.setStep(3)}
						/>
					)}
					{step === 3 && checkout && (
						<CheckoutProof
							uploaded={checkout.proofUploaded}
							busy={busy}
							uploadFailed={flow.uploadFailed}
							onUpload={flow.upload}
							onSubmit={flow.submit}
							onBack={() => flow.setStep(2)}
						/>
					)}
				</section>
				<aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
					{checkout ? (
						<OrderSummary quote={checkout.quote} />
					) : (
						<CartSummary cart={cart} />
					)}
					{checkout && (
						<div className="rounded-xl bg-muted/50 p-5">
							<h2 className="mb-3 text-sm font-semibold">
								{t("Delivery address")}
							</h2>
							<DeliveryAddress address={checkout.address} />
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
