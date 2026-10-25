import {
	validateMatchingValue,
	validateStringLength,
} from "@better-auth-ui/core";
import { useAuth } from "@better-auth-ui/react";

/**
 * The password length rules (from `emailAndPassword`) and the "passwords
 * match" check, shared by every form that sets a password.
 */
export function usePasswordValidation() {
	const { emailAndPassword, localization } = useAuth();
	const maxLength = emailAndPassword?.maxPasswordLength;
	const minLength = emailAndPassword?.minPasswordLength;

	const validatePassword = (value: string) =>
		validateStringLength(value, {
			maxLength,
			maxLengthMessage: localization.auth.tooLong.replace(
				"{{max}}",
				String(maxLength),
			),
			minLength,
			minLengthMessage: localization.auth.tooShort.replace(
				"{{min}}",
				String(minLength),
			),
			requiredMessage: localization.auth.fieldRequired,
		});

	const validateConfirmation = (value: string, password: string) =>
		validatePassword(value) ??
		validateMatchingValue(
			value,
			password,
			localization.auth.passwordsDoNotMatch,
		);

	return { validatePassword, validateConfirmation };
}
