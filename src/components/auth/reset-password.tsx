import {
	getAuthLinkURL,
	isPasswordCompromisedError,
} from "@better-auth-ui/core";
import { useAuth } from "@better-auth-ui/react";
import { useResetPasswordOtp } from "@better-auth-ui/react/plugins/email-otp";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "#/components/form/app-form";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldDescription, FieldGroup } from "#/components/ui/field";
import { authClient } from "#/features/auth/auth-client";
import { fill, useMessages } from "#/i18n/messages";
import { cn } from "#/lib/utils";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { ResendCodeButton } from "./resend-code-button";
import { RESET_PASSWORD_EMAIL_STORAGE_KEY } from "./storage-keys";
import { usePasswordValidation } from "./use-password-validation";
import { useStoredEmail } from "./use-stored-email";

export type ResetPasswordProps = {
	className?: string;
};

/** Confirms the emailed code and sets a new password. */
export function ResetPassword({ className }: ResetPasswordProps) {
	const {
		basePaths,
		emailAndPassword,
		localization,
		navigate,
		redirectTo,
		viewPaths,
		Link,
	} = useAuth();
	const messages = useMessages();
	const { validatePassword, validateConfirmation } = usePasswordValidation();
	const signInURL = getAuthLinkURL(
		`${basePaths.auth}/${viewPaths.auth.signIn}`,
		redirectTo,
	);

	const { mutateAsync: resetPassword, isPending } = useResetPasswordOtp(
		authClient,
		{
			onError: (error) => {
				// The haveIBeenPwned plugin rejects on the password itself, so it
				// belongs against the field rather than in a toast.
				if (isPasswordCompromisedError(error)) {
					setIsCompromised(true);
				}
			},
			onSuccess: () => {
				sessionStorage.removeItem(RESET_PASSWORD_EMAIL_STORAGE_KEY);
				toast.success(localization.auth.passwordResetSuccess);
				navigate({ to: signInURL });
			},
		},
	);
	const [isCompromised, setIsCompromised] = useState(false);

	const email = useStoredEmail(RESET_PASSWORD_EMAIL_STORAGE_KEY);

	const form = useAppForm({
		defaultValues: { otp: "", confirmPassword: "", password: "" },
		onSubmit: async ({ value }) => {
			try {
				await resetPassword({
					email,
					otp: value.otp,
					password: value.password,
				});
			} catch (error) {
				if (!isPasswordCompromisedError(error)) throw error;
			}
		},
	});

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					{localization.auth.resetPassword}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form.AppForm>
					<form.FormRoot>
						<FieldGroup>
							<FieldDescription>
								{email
									? fill(messages.resetPassword.instructions, { email })
									: messages.resetPassword.noEmail}
							</FieldDescription>
							<form.AppField
								name="otp"
								validators={{
									onChange: z
										.string()
										.regex(/^\d{6}$/, messages.otp.invalidCode),
								}}
							>
								{(field) => (
									<field.FormTextField
										label={messages.resetPassword.codeLabel}
										inputMode="numeric"
										autoComplete="one-time-code"
										maxLength={6}
										required
										disabled={isPending || !email}
									/>
								)}
							</form.AppField>
							<form.AppField
								name="password"
								validators={{
									onChange: ({ value }) => validatePassword(value),
								}}
							>
								{(field) => (
									<field.FormTextField
										label={localization.auth.password}
										type="password"
										autoComplete="new-password"
										placeholder={localization.auth.newPasswordPlaceholder}
										required
										disabled={isPending || !email}
										minLength={emailAndPassword?.minPasswordLength}
										maxLength={emailAndPassword?.maxPasswordLength}
										error={
											isCompromised && localization.auth.passwordCompromised
										}
										onValueChange={() => setIsCompromised(false)}
									>
										<PasswordStrengthMeter password={field.state.value} />
									</field.FormTextField>
								)}
							</form.AppField>

							{emailAndPassword?.confirmPassword && (
								<form.AppField
									name="confirmPassword"
									validators={{
										onChangeListenTo: ["password"],
										onChange: ({ fieldApi, value }) =>
											validateConfirmation(
												value,
												fieldApi.form.getFieldValue("password"),
											),
									}}
								>
									{(field) => (
										<field.FormTextField
											label={localization.auth.confirmPassword}
											type="password"
											autoComplete="new-password"
											placeholder={localization.auth.confirmPasswordPlaceholder}
											required
											disabled={isPending || !email}
											minLength={emailAndPassword?.minPasswordLength}
											maxLength={emailAndPassword?.maxPasswordLength}
										/>
									)}
								</form.AppField>
							)}

							<div className="flex flex-col gap-3">
								<form.FormServerError />
								<form.FormSubmitButton disabled={isPending || !email}>
									{localization.auth.resetPassword}
								</form.FormSubmitButton>
							</div>
							{email && (
								<ResendCodeButton
									disabled={isPending}
									onResend={async () => {
										const { error } =
											await authClient.emailOtp.requestPasswordReset({ email });
										if (error) throw new Error(error.message);
									}}
								/>
							)}
							<Link
								href={`${basePaths.auth}/${viewPaths.auth.forgotPassword}`}
								className="text-sm underline underline-offset-4"
							>
								{messages.resetPassword.useAnotherEmail}
							</Link>
						</FieldGroup>
					</form.FormRoot>
				</form.AppForm>

				<div className="flex flex-col gap-3 items-center w-full mt-4">
					<FieldDescription className="text-center">
						{localization.auth.rememberYourPassword}{" "}
						<Link
							href={getAuthLinkURL(
								`${basePaths.auth}/${viewPaths.auth.signIn}`,
								redirectTo,
							)}
							className="underline underline-offset-4"
						>
							{localization.auth.signIn}
						</Link>
					</FieldDescription>
				</div>
			</CardContent>
		</Card>
	);
}
