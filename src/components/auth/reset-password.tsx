import {
	getAuthLinkURL,
	isPasswordCompromisedError,
	validateMatchingValue,
	validateStringLength,
} from "@better-auth-ui/core";
import { useAuth } from "@better-auth-ui/react";
import { useResetPasswordOtp } from "@better-auth-ui/react/plugins/email-otp";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldDescription, FieldGroup } from "#/components/ui/field";
import { authClient } from "#/features/auth/auth-client";
import { cn } from "#/lib/utils";
import { useAuthForm } from "./auth-form";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { ResendCodeButton } from "./resend-code-button";
import { RESET_PASSWORD_EMAIL_STORAGE_KEY } from "./storage-keys";
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

	const form = useAuthForm({
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
					<form.AuthFormRoot>
						<FieldGroup>
							<FieldDescription>
								{email
									? `Enter the code sent to ${email} and choose a new password.`
									: "Request a reset code first using Forgot password."}
							</FieldDescription>
							<form.AppField
								name="otp"
								validators={{
									onChange: z
										.string()
										.regex(/^\d{6}$/, "Enter the six-digit code"),
								}}
							>
								{(field) => (
									<field.AuthFormTextField
										label="Reset code"
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
									onChange: ({ value }) =>
										validateStringLength(value, {
											maxLength: emailAndPassword?.maxPasswordLength,
											maxLengthMessage: localization.auth.tooLong.replace(
												"{{max}}",
												String(emailAndPassword?.maxPasswordLength),
											),
											minLength: emailAndPassword?.minPasswordLength,
											minLengthMessage: localization.auth.tooShort.replace(
												"{{min}}",
												String(emailAndPassword?.minPasswordLength),
											),
											requiredMessage: localization.auth.fieldRequired,
										}),
								}}
							>
								{(field) => (
									<field.AuthFormTextField
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
									</field.AuthFormTextField>
								)}
							</form.AppField>

							{emailAndPassword?.confirmPassword && (
								<form.AppField
									name="confirmPassword"
									validators={{
										onChangeListenTo: ["password"],
										onChange: ({ fieldApi, value }) =>
											validateStringLength(value, {
												maxLength: emailAndPassword?.maxPasswordLength,
												maxLengthMessage: localization.auth.tooLong.replace(
													"{{max}}",
													String(emailAndPassword?.maxPasswordLength),
												),
												minLength: emailAndPassword?.minPasswordLength,
												minLengthMessage: localization.auth.tooShort.replace(
													"{{min}}",
													String(emailAndPassword?.minPasswordLength),
												),
												requiredMessage: localization.auth.fieldRequired,
											}) ??
											validateMatchingValue(
												value,
												fieldApi.form.getFieldValue("password"),
												localization.auth.passwordsDoNotMatch,
											),
									}}
								>
									{(field) => (
										<field.AuthFormTextField
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
								<form.AuthFormServerError />
								<form.AuthFormSubmitButton disabled={isPending || !email}>
									{localization.auth.resetPassword}
								</form.AuthFormSubmitButton>
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
								Request a code for another email
							</Link>
						</FieldGroup>
					</form.AuthFormRoot>
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
