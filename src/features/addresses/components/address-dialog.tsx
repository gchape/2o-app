import { useId, useMemo } from "react";
import { useAppForm } from "#/components/form/app-form";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Switch } from "#/components/ui/switch";
import { useLocale } from "#/i18n/locale";
import { useTranslation } from "#/i18n/translate";
import type { Address } from "../address.functions";
import { createAddressSchema } from "../address.schema";
import { useSaveAddress } from "../use-addresses";

const textFields = [
	{ name: "fullName", label: "Name", autoComplete: "name", required: true },
	{
		name: "line1",
		label: "Address 1",
		autoComplete: "address-line1",
		required: true,
	},
	{
		name: "line2",
		label: "Address 2",
		autoComplete: "address-line2",
		description: "Apartment, suite, or forwarding account number (optional).",
	},
	{
		name: "city",
		label: "City",
		autoComplete: "address-level2",
		required: true,
	},
	{
		name: "state",
		label: "State",
		autoComplete: "address-level1",
		required: true,
	},
	{
		name: "postalCode",
		label: "ZIP",
		autoComplete: "postal-code",
		required: true,
	},
	{
		name: "country",
		label: "Country",
		autoComplete: "country-name",
		required: true,
	},
	{
		name: "phone",
		label: "Tel",
		autoComplete: "tel",
		type: "tel",
		required: true,
	},
] as const;

type AddressDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The address being edited; leave out to add a new one. */
	address?: Address;
	/** Adding the account's first address, which is primary automatically. */
	firstAddress?: boolean;
};

/**
 * The add/edit form in a centered dialog. The dialog unmounts its content when it
 * closes, so every opening starts from a fresh form.
 */
export function AddressDialog({
	open,
	onOpenChange,
	address,
	firstAddress = false,
}: AddressDialogProps) {
	const t = useTranslation();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{address ? t("Edit address") : t("Add address")}
					</DialogTitle>
					<p className="text-sm text-muted-foreground">
						{t("Enter the recipient and delivery address details.")}
					</p>
				</DialogHeader>

				<AddressForm
					address={address}
					firstAddress={firstAddress}
					onDone={() => onOpenChange(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}

function primaryHint(
	address: Address | undefined,
	firstAddress: boolean,
	t: ReturnType<typeof useTranslation>,
) {
	if (address?.isPrimary) {
		return t(
			"This is your primary address. Make another address primary to change it.",
		);
	}
	if (firstAddress) return t("Your first address is primary automatically.");
	return t("Make this your default delivery address.");
}

type AddressFormProps = {
	address?: Address;
	firstAddress: boolean;
	onDone: () => void;
};

function AddressForm({ address, firstAddress, onDone }: AddressFormProps) {
	const locale = useLocale();
	const addressSchema = useMemo(() => createAddressSchema(locale), [locale]);
	const t = useTranslation();
	const save = useSaveAddress();
	const primaryId = useId();
	// An account always has a primary address, so these cases can't be unticked.
	const lockedPrimary = Boolean(address?.isPrimary) || firstAddress;

	const form = useAppForm({
		defaultValues: {
			fullName: address?.fullName ?? "",
			phone: address?.phone ?? "",
			line1: address?.line1 ?? "",
			line2: address?.line2 ?? "",
			city: address?.city ?? "",
			state: address?.state ?? "",
			country: address?.country ?? "United States",
			postalCode: address?.postalCode ?? "",
			isPrimary: lockedPrimary,
		},
		validators: { onChange: addressSchema },
		onSubmit: async ({ value }) => {
			await save.mutateAsync({ id: address?.id, address: value });
			onDone();
		},
	});

	return (
		<form.AppForm>
			<form.FormRoot className="flex min-h-0 flex-1 flex-col">
				<FieldGroup className="gap-5 pb-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{textFields.map(({ name, ...props }) => (
							<div
								key={name}
								className={
									name === "fullName" || name === "line1" || name === "line2"
										? "sm:col-span-2"
										: undefined
								}
							>
								<form.AppField name={name}>
									{(field) => (
										<field.FormTextField
											{...props}
											label={t(props.label)}
											description={
												"description" in props
													? t(props.description)
													: undefined
											}
											disabled={save.isPending}
										/>
									)}
								</form.AppField>
							</div>
						))}
					</div>

					<form.AppField name="isPrimary">
						{(field) => (
							<Field orientation="horizontal">
								<FieldContent>
									<FieldLabel htmlFor={primaryId}>
										{t("Use as primary address")}
									</FieldLabel>
									<FieldDescription>
										{primaryHint(address, firstAddress, t)}
									</FieldDescription>
								</FieldContent>
								<Switch
									id={primaryId}
									name={field.name}
									onBlur={field.handleBlur}
									checked={field.state.value}
									disabled={lockedPrimary || save.isPending}
									onCheckedChange={field.handleChange}
								/>
							</Field>
						)}
					</form.AppField>

					<form.FormServerError />
				</FieldGroup>

				<div className="flex justify-end gap-2 border-t pt-5">
					<Button
						type="button"
						variant="outline"
						disabled={save.isPending}
						onClick={onDone}
					>
						{t("Cancel")}
					</Button>
					<form.FormSubmitButton isPending={save.isPending}>
						{address ? t("Save changes") : t("Save address")}
					</form.FormSubmitButton>
				</div>
			</form.FormRoot>
		</form.AppForm>
	);
}
