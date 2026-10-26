import { useState } from "react";
import { CircleCheckIcon, Upload } from "#/components/icons";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";
import { MAX_PROOF_BYTES, PROOF_TYPES } from "../checkout";

export function CheckoutProof({
	uploaded,
	busy,
	uploadFailed,
	onUpload,
	onSubmit,
	onBack,
}: {
	uploaded: boolean;
	busy: string | null;
	uploadFailed: boolean;
	onUpload: (file: File) => void;
	onSubmit: () => void;
	onBack: () => void;
}) {
	const t = useTranslation();
	const [invalidFile, setInvalidFile] = useState(false);
	const help = t("Use a PNG, JPEG or WebP image up to 2 MB.");
	return (
		<>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{t(
					"The screenshot should show the amount, recipient and transfer reference. Hide unrelated balances or transactions.",
				)}
			</p>
			<div
				className={cn(
					"space-y-4 rounded-xl border border-dashed p-5",
					uploaded ? "border-price/30 bg-price-savings/50" : "bg-muted/30",
				)}
			>
				{uploaded ? (
					<CircleCheckIcon className="size-8 text-price" aria-hidden="true" />
				) : (
					<Upload className="size-8 text-muted-foreground" aria-hidden="true" />
				)}
				<label htmlFor="payment-proof" className="block text-sm font-semibold">
					{uploaded ? t("Replace payment screenshot") : t("Payment screenshot")}
				</label>
				<div className="relative rounded-lg border bg-background px-4 py-3 text-center text-sm font-semibold focus-within:ring-2 focus-within:ring-ring has-disabled:opacity-50">
					<span aria-hidden="true">{t("Choose screenshot")}</span>
					<Input
						id="payment-proof"
						type="file"
						accept={PROOF_TYPES.join(",")}
						disabled={Boolean(busy)}
						aria-invalid={invalidFile || uploadFailed}
						aria-describedby="proof-help proof-status"
						className="absolute inset-0 size-full cursor-pointer opacity-0"
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (!file) return;
							const invalid =
								!file.size ||
								file.size > MAX_PROOF_BYTES ||
								!PROOF_TYPES.includes(file.type);
							setInvalidFile(invalid);
							if (!invalid) onUpload(file);
						}}
					/>
				</div>
				<p
					id="proof-help"
					className={cn(
						"text-xs",
						invalidFile ? "text-destructive" : "text-muted-foreground",
					)}
					role={invalidFile ? "alert" : undefined}
				>
					{help}
				</p>
				<p id="proof-status" role="status" className="text-sm">
					{busy === "upload"
						? t("Uploading…")
						: invalidFile || uploadFailed
							? t("Choose a valid screenshot to continue.")
							: uploaded
								? t("Payment screenshot uploaded successfully.")
								: t("Upload a screenshot to enable Place order.")}
				</p>
			</div>
			<p className="text-xs leading-relaxed text-muted-foreground">
				{t(
					"Your order details and payment proof will be sent to our order team via Telegram for verification.",
				)}
			</p>
			<Button
				className="h-auto min-h-12 w-full whitespace-normal py-3"
				size="lg"
				disabled={!uploaded || Boolean(busy) || invalidFile || uploadFailed}
				onClick={onSubmit}
			>
				{busy === "submit" ? t("Placing order…") : t("Place order")}
			</Button>
			<Button
				variant="ghost"
				className="h-auto min-h-11 w-full whitespace-normal py-2"
				disabled={Boolean(busy)}
				onClick={onBack}
			>
				{t("Back to payment details")}
			</Button>
		</>
	);
}
