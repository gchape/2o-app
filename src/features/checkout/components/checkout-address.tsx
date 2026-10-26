import { Button } from "#/components/ui/button";
import type { Address } from "#/features/addresses/address.functions";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";
import { type CheckoutAddress, isUsCountry } from "../checkout";

export function DeliveryAddress({
	address,
}: {
	address: CheckoutAddress | Address;
}) {
	const t = useTranslation();
	return (
		<span className="block min-w-0 wrap-anywhere text-sm leading-relaxed">
			<strong className="font-semibold">{address.fullName}</strong>
			<br />
			{address.line1}
			<br />
			{address.line2 && (
				<>
					{address.line2}
					<br />
				</>
			)}
			{address.city}, {address.state} {address.postalCode}
			<br />
			{isUsCountry(address.country) ? t("United States") : address.country}
			<br />
			<span className="text-muted-foreground">{address.phone}</span>
		</span>
	);
}

export function CheckoutAddressPicker({
	addresses,
	selectedId,
	disabled,
	onSelect,
	onAdd,
}: {
	addresses: Address[];
	selectedId?: string;
	disabled: boolean;
	onSelect: (id: string) => void;
	onAdd: () => void;
}) {
	const t = useTranslation();
	return (
		<>
			{!addresses.length && (
				<p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
					{t(
						"Add a U.S. address to get started. You can use your forwarding address.",
					)}
				</p>
			)}
			<fieldset className="space-y-3" disabled={disabled}>
				<legend className="sr-only">{t("Delivery address")}</legend>
				{addresses.map((address) => (
					<label
						key={address.id}
						className={cn(
							"flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring",
							selectedId === address.id
								? "border-foreground/70 bg-brand/5"
								: "hover:bg-muted/50",
							!isUsCountry(address.country) &&
								"cursor-not-allowed bg-muted/40 text-muted-foreground",
						)}
					>
						<input
							type="radio"
							name="delivery-address"
							value={address.id}
							checked={selectedId === address.id}
							disabled={!isUsCountry(address.country)}
							onChange={() => onSelect(address.id)}
							className="mt-1 size-4 shrink-0 accent-current"
						/>
						<span className="min-w-0">
							<DeliveryAddress address={address} />
							{!isUsCountry(address.country) && (
								<span className="mt-2 block text-xs">
									{t("We only ship to U.S. addresses.")}
								</span>
							)}
						</span>
					</label>
				))}
			</fieldset>
			<Button variant="outline" disabled={disabled} onClick={onAdd}>
				{t("Add address")}
			</Button>
			<p className="text-xs leading-relaxed text-muted-foreground">
				{t(
					"A U.S. forwarding address is welcome. Include your apartment or forwarding account number.",
				)}
			</p>
		</>
	);
}
