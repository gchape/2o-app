import { useEffect, useState } from "react";
import { Check, Copy } from "#/components/icons";
import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import { site } from "#/data/site";
import { languageTags, useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import { usePriceFormatter } from "#/lib/price";
import type { CheckoutView } from "../checkout";

function PaymentDetail({ label, value }: { label: string; value: string }) {
	const t = useTranslation();
	const [status, setStatus] = useState("");
	useEffect(() => {
		if (!status) return;
		const timer = setTimeout(() => setStatus(""), 3_000);
		return () => clearTimeout(timer);
	}, [status]);
	return (
		<div className="space-y-2">
			<dt className="text-xs font-medium text-muted-foreground">{label}</dt>
			<dd className="flex items-start gap-3">
				<code className="min-w-0 flex-1 break-all rounded-lg bg-muted/60 px-3 py-3 text-sm select-all">
					{value}
				</code>
				<Button
					variant="outline"
					size="icon"
					className="size-11"
					aria-label={t("Copy {{label}}", { label })}
					onClick={async () => {
						try {
							await navigator.clipboard.writeText(value);
							setStatus(t("Copied"));
						} catch {
							setStatus(t("Couldn't copy. Select and copy the text manually."));
						}
					}}
				>
					{status === t("Copied") ? (
						<Check aria-hidden="true" />
					) : (
						<Copy aria-hidden="true" />
					)}
				</Button>
			</dd>
			{status && (
				<dd role="status" className="text-xs text-muted-foreground">
					{status}
				</dd>
			)}
		</div>
	);
}

export function CheckoutPayment({
	checkout,
	onContinue,
}: {
	checkout: CheckoutView;
	onContinue: () => void;
}) {
	const t = useTranslation();
	const locale = useLocale();
	const { formatPrice } = usePriceFormatter();
	const [expired, setExpired] = useState(
		() => Date.now() >= Date.parse(checkout.expiresAt),
	);
	useEffect(() => {
		const timer = setTimeout(
			() => setExpired(true),
			Math.max(0, Date.parse(checkout.expiresAt) - Date.now()),
		);
		return () => clearTimeout(timer);
	}, [checkout.expiresAt]);
	return (
		<>
			{!expired && (
				<p className="text-sm leading-relaxed text-muted-foreground">
					{t(
						"Transfer either amount below and include your payment reference.",
					)}
				</p>
			)}
			{expired ? (
				<p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm">
					{t(
						"These payment instructions have expired. Do not make a new transfer. If you already paid, upload your proof; otherwise start a new checkout.",
					)}
				</p>
			) : (
				<>
					<div className="brand-surface rounded-xl p-5 text-white sm:p-6">
						<p className="type-eyebrow text-white/65">
							{t("Amount to transfer")}
						</p>
						<p className="type-num mt-3 flex flex-wrap items-baseline gap-x-2 text-4xl">
							<span>{formatPrice(checkout.quote.totalUsd, "USD")}</span>
							<span className="font-sans text-sm font-medium text-white/65">
								USD
							</span>
						</p>
						<p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-white/15 pt-4 text-sm text-white/70">
							<span>{t("Or pay in lari:")}</span>
							<span className="type-num text-xl text-brand">
								{formatPrice(checkout.quote.totalGel, "GEL")}
							</span>
							<span>GEL</span>
						</p>
					</div>
					<dl className="space-y-5">
						<PaymentDetail
							label={t("IBAN")}
							value={checkout.quote.pricing.iban}
						/>
						<PaymentDetail label={t("Payment reference")} value={checkout.id} />
					</dl>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{t("Payment instructions valid until {{time}}", {
							time: new Intl.DateTimeFormat(languageTags[locale], {
								dateStyle: "medium",
								timeStyle: "short",
								timeZone: site.timezone,
							}).format(new Date(checkout.expiresAt)),
						})}
					</p>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{t(
							"Pay in one currency only. Your total is fixed until these instructions expire. Your bank may charge a separate transfer fee.",
						)}
					</p>
				</>
			)}
			<Button
				className="h-auto min-h-12 w-full whitespace-normal py-3"
				size="lg"
				onClick={onContinue}
			>
				{t("I have transferred — upload proof")}
			</Button>
			{expired && (
				<LinkButton
					to="/checkout"
					search={{}}
					variant="outline"
					className="h-auto min-h-11 whitespace-normal py-2"
				>
					{t("Start a new checkout")}
				</LinkButton>
			)}
		</>
	);
}
