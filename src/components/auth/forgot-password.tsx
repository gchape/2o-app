import { validateEmailAddress } from "@better-auth-ui/core";
import { useAuth, useFetchOptions } from "@better-auth-ui/react";
import { useRequestPasswordResetOtp } from "@better-auth-ui/react/plugins/email-otp";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldDescription, FieldGroup } from "#/components/ui/field";
import { authClient } from "#/features/auth/auth-client";
import { cn } from "#/lib/utils";
import { useAuthForm } from "./auth-form";
import { RESET_PASSWORD_EMAIL_STORAGE_KEY } from "./storage-keys";

export type ForgotPasswordProps = {
	className?: string;
};

/** Requests a password reset code and opens the reset form. */
export function ForgotPassword({ className }: ForgotPasswordProps) {
	const { basePaths, localization, navigate, plugins, viewPaths, Link } =
		useAuth();

	const { fetchOptions, resetFetchOptions } = useFetchOptions();

	const { mutateAsync: requestPasswordReset, isPending } =
		useRequestPasswordResetOtp(authClient, {
			onError: () => {
				resetFetchOptions();
			},
			onSuccess: (_data, { email }) => {
				sessionStorage.setItem(RESET_PASSWORD_EMAIL_STORAGE_KEY, email);
				navigate({ to: `${basePaths.auth}/${viewPaths.auth.resetPassword}` });
			},
		});

	const form = useAuthForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) =>
			await requestPasswordReset({
				email: value.email,
				fetchOptions,
			}),
	});

	const Captcha = plugins.find(
		(plugin) => plugin.captchaComponent,
	)?.captchaComponent;

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					{localization.auth.forgotPassword}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form.AppForm>
					<form.AuthFormRoot>
						<FieldGroup>
							<form.AppField
								name="email"
								validators={{
									onChange: ({ value }) =>
										validateEmailAddress(value, {
											invalidMessage: localization.auth.invalidEmail,
											requiredMessage: localization.auth.fieldRequired,
										}),
								}}
							>
								{(field) => (
									<field.AuthFormTextField
										label={localization.auth.email}
										type="email"
										autoComplete="email"
										placeholder={localization.auth.emailPlaceholder}
										required
										disabled={isPending}
									/>
								)}
							</form.AppField>

							{Captcha && <div className="flex justify-center">{Captcha}</div>}

							<form.AuthFormServerError />
							<div className="flex flex-col gap-3">
								<form.AuthFormSubmitButton
									isPending={isPending}
									disabled={isPending}
								>
									Send reset code
								</form.AuthFormSubmitButton>
							</div>
						</FieldGroup>
					</form.AuthFormRoot>
				</form.AppForm>

				<div className="flex flex-col gap-3 items-center w-full mt-4">
					<FieldDescription className="text-center">
						{localization.auth.rememberYourPassword}{" "}
						<Link
							href={`${basePaths.auth}/${viewPaths.auth.signIn}`}
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
