import { useId } from "react";
import { useAuthForm } from "#/components/auth/auth-form";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { Switch } from "#/components/ui/switch";
import { site } from "#/data/site";
import type { Address } from "../address.functions";
import { addressSchema } from "../address.schema";
import { useSaveAddress } from "../use-addresses";

const textFields = [
	{
		name: "fullName",
		label: "Full name",
		autoComplete: "name",
		required: true,
	},
	{
		name: "phone",
		label: "Phone number",
		autoComplete: "tel",
		type: "tel",
		required: true,
	},
	{
		name: "line1",
		label: "Street address",
		autoComplete: "address-line1",
		required: true,
	},
	{
		name: "line2",
		label: "Apartment, floor, entrance (optional)",
		autoComplete: "address-line2",
	},
	{
		name: "city",
		label: "City",
		autoComplete: "address-level2",
		required: true,
	},
	{
		name: "postalCode",
		label: "Postal code (optional)",
		autoComplete: "postal-code",
	},
] as const;

type AddressSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The address being edited; leave out to add a new one. */
	address?: Address;
	/** Adding the account's first address, which is primary automatically. */
	firstAddress?: boolean;
};

/**
 * The add/edit form in a side sheet. The sheet unmounts its content when it
 * closes, so every opening starts from a fresh form.
 */
export function AddressSheet({
	open,
	onOpenChange,
	address,
	firstAddress = false,
}: AddressSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{address ? "Edit address" : "Add address"}</SheetTitle>
					<SheetDescription>
						We deliver within {site.delivery.region}.
					</SheetDescription>
				</SheetHeader>

				<AddressForm
					address={address}
					firstAddress={firstAddress}
					onDone={() => onOpenChange(false)}
				/>
			</SheetContent>
		</Sheet>
	);
}

function primaryHint(address: Address | undefined, firstAddress: boolean) {
	if (address?.isPrimary) {
		return "This is your primary address. Make another address primary to change it.";
	}
	if (firstAddress) return "Your first address is primary automatically.";
	return "Make this your default delivery address.";
}

type AddressFormProps = {
	address?: Address;
	firstAddress: boolean;
	onDone: () => void;
};

function AddressForm({ address, firstAddress, onDone }: AddressFormProps) {
	const save = useSaveAddress();
	const primaryId = useId();
	// An account always has a primary address, so these cases can't be unticked.
	const lockedPrimary = Boolean(address?.isPrimary) || firstAddress;

	const form = useAuthForm({
		defaultValues: {
			fullName: address?.fullName ?? "",
			phone: address?.phone ?? "",
			line1: address?.line1 ?? "",
			line2: address?.line2 ?? "",
			city: address?.city ?? "",
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
			<form.AuthFormRoot className="flex min-h-0 flex-1 flex-col">
				<FieldGroup className="flex-1 gap-4 overflow-y-auto px-6 pb-6">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{textFields.map(({ name, ...props }) => (
							<div
								key={name}
								className={
									name === "city" || name === "postalCode"
										? undefined
										: "sm:col-span-2"
								}
							>
								<form.AppField name={name}>
									{(field) => (
										<field.AuthFormTextField
											{...props}
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
										Use as primary address
									</FieldLabel>
									<FieldDescription>
										{primaryHint(address, firstAddress)}
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

					<form.AuthFormServerError />
				</FieldGroup>

				<SheetFooter className="flex-row justify-end border-t">
					<Button
						type="button"
						variant="outline"
						disabled={save.isPending}
						onClick={onDone}
					>
						Cancel
					</Button>
					<form.AuthFormSubmitButton isPending={save.isPending}>
						{address ? "Save changes" : "Save address"}
					</form.AuthFormSubmitButton>
				</SheetFooter>
			</form.AuthFormRoot>
		</form.AppForm>
	);
}
