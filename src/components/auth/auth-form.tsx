import {
	type AdditionalField as AdditionalFieldConfig,
	type AdditionalFieldFormValue,
	DEFAULT_ADDITIONAL_FIELD_VALIDATION_DEBOUNCE_MS,
	getFormFieldErrors,
	validateAdditionalFieldRequired,
	validateAdditionalFieldValue,
} from "@better-auth-ui/core";
import { createFormHook } from "@tanstack/react-form";

import {
	clearFieldServerError,
	fieldComponents,
	fieldContext,
	formComponents,
	formContext,
	isFieldInvalid,
	useFieldContext,
	useFormContext,
} from "#/components/form/app-form";
import { AdditionalField, type AdditionalFieldProps } from "./additional-field";

type AuthFormAdditionalFieldProps = Omit<
	AdditionalFieldProps,
	"errors" | "isInvalid" | "name" | "onBlur" | "onChange" | "value"
>;

function AuthFormAdditionalField(props: AuthFormAdditionalFieldProps) {
	const field = useFieldContext<AdditionalFieldFormValue>();
	const form = useFormContext();
	const isInvalid = isFieldInvalid(field.state.meta);

	return (
		<AdditionalField
			{...props}
			errors={
				isInvalid ? getFormFieldErrors(field.state.meta.errors) : undefined
			}
			isInvalid={isInvalid}
			name={field.name}
			onBlur={field.handleBlur}
			onChange={(value) => {
				clearFieldServerError(form, field.name);
				field.handleChange(value);
			}}
			value={field.state.value}
		/>
	);
}

/**
 * `useAppForm` plus the component that renders Better Auth's configurable
 * additional fields. Only the sign-up and profile forms need it.
 */
export const { useAppForm: useAuthForm } = createFormHook({
	fieldComponents: { ...fieldComponents, AuthFormAdditionalField },
	fieldContext,
	formComponents,
	formContext,
});

export function getAuthAdditionalFieldValidators(
	field: AdditionalFieldConfig,
	requiredMessage: string,
) {
	return {
		onChange: ({ value }: { value: AdditionalFieldFormValue }) =>
			validateAdditionalFieldRequired(field, value, requiredMessage),
		onChangeAsync: field.validate
			? ({ value }: { value: AdditionalFieldFormValue }) =>
					validateAdditionalFieldValue(field, value)
			: undefined,
		onChangeAsyncDebounceMs: field.validate
			? (field.validateDebounceMs ??
				DEFAULT_ADDITIONAL_FIELD_VALIDATION_DEBOUNCE_MS)
			: undefined,
	};
}
