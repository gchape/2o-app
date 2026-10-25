import {
	getFormFieldErrors,
	normalizeAuthFormServerError,
} from "@better-auth-ui/core";
import {
	type AnyFormApi,
	createFormHook,
	createFormHookContexts,
} from "@tanstack/react-form";
import {
	type ComponentProps,
	type FormEvent,
	type ReactNode,
	useId,
	useRef,
} from "react";

import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Spinner } from "#/components/ui/spinner";
import { useMessages } from "#/i18n/messages";
import { PasswordInput } from "./password-input";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function focusFirstInvalidControl(form: HTMLFormElement) {
	requestAnimationFrame(() => {
		form
			.querySelector<HTMLElement>(
				'[aria-invalid="true"]:not([disabled]), :invalid:not([disabled])',
			)
			?.focus();
	});
}

function FormFieldError() {
	const field = useFieldContext<unknown>();
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

	if (!isInvalid) return null;

	const errors = getFormFieldErrors(field.state.meta.errors);

	return errors.length > 0 ? <FieldError errors={errors} /> : null;
}

function FormServerError() {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.errorMap.onServer}>
			{(error) => {
				const formError =
					error && typeof error === "object" && "form" in error
						? error.form
						: error;
				const errors = getFormFieldErrors(formError ? [formError] : []);
				return errors.length > 0 ? <FieldError errors={errors} /> : null;
			}}
		</form.Subscribe>
	);
}

function setFormServerError(
	form: AnyFormApi,
	error: unknown,
	fallbackMessage: string,
) {
	const normalized = normalizeAuthFormServerError(error, fallbackMessage);
	form.setErrorMap({
		onServer: {
			fields: normalized.fields ?? {},
			form: normalized.form,
		},
	});
}

function clearFormServerError(form: AnyFormApi) {
	form.setErrorMap({ onServer: { fields: {} } });
}

/** Drops the server's complaint about one field as soon as the shopper edits it. */
export function clearFieldServerError(form: AnyFormApi, fieldName: string) {
	form.setErrorMap({ onServer: undefined });
	if (!fieldName) return;

	const fieldMeta = form.getFieldMeta(fieldName as never);
	if (!fieldMeta?.errorMap.onServer) return;

	form.setFieldMeta(fieldName as never, (current = fieldMeta) => ({
		...current,
		errorMap: { ...current.errorMap, onServer: undefined },
		errorSourceMap: { ...current.errorSourceMap, onServer: undefined },
	}));
}

async function submitForm(form: AnyFormApi, fallbackMessage: string) {
	clearFormServerError(form);
	try {
		await form.handleSubmit();
		return form.state.isValid;
	} catch (error) {
		if (!form.state.errorMap.onServer) {
			setFormServerError(form, error, fallbackMessage);
		}
		return false;
	}
}

type FormRootProps = Omit<ComponentProps<"form">, "onSubmit"> & {
	onBeforeSubmit?: () => void;
	serverErrorMessage?: string;
};

function FormRoot({
	children,
	onBeforeSubmit,
	onInput,
	serverErrorMessage,
	...props
}: FormRootProps) {
	const form = useFormContext();
	const messages = useMessages();
	const submittingRef = useRef(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submittingRef.current || form.state.isSubmitting) return;

		const formElement = event.currentTarget;
		onBeforeSubmit?.();
		submittingRef.current = true;
		try {
			const isValid = await submitForm(
				form,
				serverErrorMessage ?? messages.form.submitFailed,
			);
			if (!isValid) focusFirstInvalidControl(formElement);
		} finally {
			submittingRef.current = false;
		}
	}

	return (
		<form
			{...props}
			onInvalid={(event) => focusFirstInvalidControl(event.currentTarget)}
			onInput={(event) => {
				const target = event.target;
				const fieldName =
					target instanceof HTMLInputElement ||
					target instanceof HTMLSelectElement ||
					target instanceof HTMLTextAreaElement
						? target.name
						: "";
				clearFieldServerError(form, fieldName);
				onInput?.(event);
			}}
			onSubmit={submit}
		>
			{children}
		</form>
	);
}

type FormTextFieldProps = Omit<
	ComponentProps<typeof Input>,
	"name" | "onBlur" | "onChange" | "value"
> & {
	description?: ReactNode;
	error?: ReactNode;
	label: ReactNode;
	isLoading?: boolean;
	onValueChange?: (value: string) => void;
};

function FormTextField({
	isLoading = false,
	description,
	error,
	children,
	id,
	label,
	type,
	onValueChange,
	...props
}: FormTextFieldProps) {
	const field = useFieldContext<string>();
	const form = useFormContext();
	const isInvalid = Boolean(error) || isFieldInvalid(field.state.meta);
	const generatedId = useId();
	const inputId = id ?? `${generatedId}-${field.name}`;
	const descriptionId = `${inputId}-description`;
	const errorId = `${inputId}-error`;
	const Control = type === "password" ? PasswordInput : Input;

	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
			{isLoading ? (
				<Skeleton className="h-9 w-full" />
			) : (
				<Control
					{...props}
					type={type}
					aria-describedby={
						[
							props["aria-describedby"],
							description && descriptionId,
							isInvalid && errorId,
						]
							.filter(Boolean)
							.join(" ") || undefined
					}
					aria-busy={field.state.meta.isValidating || undefined}
					aria-invalid={isInvalid}
					id={inputId}
					name={field.name}
					onBlur={field.handleBlur}
					onChange={(event) => {
						clearFieldServerError(form, field.name);
						field.handleChange(event.target.value);
						onValueChange?.(event.target.value);
					}}
					value={field.state.value}
				/>
			)}
			{description && (
				<FieldDescription id={descriptionId}>{description}</FieldDescription>
			)}
			{isInvalid && (
				<div id={errorId}>
					{error ? <FieldError>{error}</FieldError> : <FormFieldError />}
				</div>
			)}
			{children}
		</Field>
	);
}

function FormSubmitButton({
	children,
	disabled,
	isPending,
	...props
}: ComponentProps<typeof Button> & { isPending?: boolean }) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={(state) => [state.isSubmitting, state.isValidating] as const}
		>
			{([isSubmitting, isValidating]) => (
				<Button
					{...props}
					aria-busy={isPending || isSubmitting || undefined}
					aria-disabled={
						disabled || isPending || isSubmitting || isValidating || undefined
					}
					disabled={disabled || isPending || isSubmitting || isValidating}
					type="submit"
				>
					{isPending || isSubmitting ? (
						<Spinner data-icon="inline-start" />
					) : null}
					{children}
				</Button>
			)}
		</form.Subscribe>
	);
}

/** Shared with `useAuthForm`, which adds the Better Auth additional-field component. */
export const fieldComponents = { FormFieldError, FormTextField };
export const formComponents = { FormRoot, FormServerError, FormSubmitButton };

/** The app's form hook: text fields, server errors and a submit button wired to TanStack Form. */
export const { useAppForm } = createFormHook({
	fieldComponents,
	fieldContext,
	formComponents,
	formContext,
});

export function isFieldInvalid({
	isTouched,
	isValid,
}: {
	isTouched: boolean;
	isValid: boolean;
}) {
	return isTouched && !isValid;
}
