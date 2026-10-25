import {
	isPasswordCompromisedError,
	validateStringLength,
} from "@better-auth-ui/core";
import {
	useAuth,
	useChangePassword,
	useFetchOptions,
	useListAccounts,
	useSession,
} from "@better-auth-ui/react";
import { useRequestPasswordResetOtp } from "@better-auth-ui/react/plugins/email-otp";
import { useState } from "react";
import { toast } from "sonner";
import { usePasswordValidation } from "#/components/auth/use-password-validation";
import { useAppForm } from "#/components/form/app-form";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import { Spinner } from "#/components/ui/spinner";
import { authClient as otpAuthClient } from "#/features/auth/auth-client";
import { useMessages } from "#/i18n/messages";
import { cn } from "#/lib/utils";
import { PasswordStrengthMeter } from "../../password-strength-meter";
import { RESET_PASSWORD_EMAIL_STORAGE_KEY } from "../../storage-keys";

export type ChangePasswordProps = {
	className?: string;
};

/**
 * Render a card form for changing the authenticated user's password.
 *
 * When the user has a credential account, displays fields for current password,
 * new password, and optionally confirm password. When the user only has social
 * accounts, displays a prompt to set a password via the reset flow.
 *
 * @returns A JSX element containing the change-password or set-password card
 */
export function ChangePassword({ className }: ChangePasswordProps) {
	const { authClient, emailAndPassword, localization } = useAuth();
	const { data: session } = useSession(authClient);
	const { data: accounts, isPending: isAccountsPending } =
		useListAccounts(authClient);

	const hasCredentialAccount = accounts?.some(
		(account) => account.providerId === "credential",
	);

	if (!isAccountsPending && !hasCredentialAccount) {
		return <SetPassword className={className} />;
	}

	return (
		<ChangePasswordForm
			className={className}
			emailAndPassword={emailAndPassword}
			localization={localization}
			session={isAccountsPending ? undefined : session}
		/>
	);
}

function SetPassword({ className }: { className?: string }) {
	const messages = useMessages();
	const { authClient, basePaths, navigate, localization, plugins, viewPaths } =
		useAuth();
	const { data: session } = useSession(authClient);
	const { fetchOptions, resetFetchOptions } = useFetchOptions();

	const { mutate: requestPasswordReset, isPending } =
		useRequestPasswordResetOtp(otpAuthClient, {
			onError: () => {
				resetFetchOptions();
			},
			onSuccess: (_data, { email }) => {
				sessionStorage.setItem(RESET_PASSWORD_EMAIL_STORAGE_KEY, email);
				navigate({ to: `${basePaths.auth}/${viewPaths.auth.resetPassword}` });
			},
		});

	const Captcha = plugins.find(
		(plugin) => plugin.captchaComponent,
	)?.captchaComponent;

	const handleSetPassword = () => {
		if (!session) return;

		requestPasswordReset({
			email: session.user.email,
			fetchOptions,
		});
	};

	return (
		<div>
			<h2 className="text-sm font-semibold mb-3">
				{localization.settings.changePassword}
			</h2>

			<Card className={cn(className)}>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm font-medium leading-tight">
							{localization.settings.setPassword}
						</p>

						<p className="text-muted-foreground text-xs mt-0.5">
							{localization.settings.setPasswordDescription}
						</p>
					</div>

					<div className="flex flex-col gap-3 items-start sm:items-end">
						{Captcha && <div>{Captcha}</div>}

						<Button
							size="sm"
							disabled={isPending || !session?.user.email}
							onClick={handleSetPassword}
						>
							{isPending && <Spinner />}
							{messages.forgotPassword.sendCode}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ChangePasswordForm({
	className,
	emailAndPassword,
	localization,
	session,
}: {
	className?: string;
	emailAndPassword: ReturnType<typeof useAuth>["emailAndPassword"];
	localization: ReturnType<typeof useAuth>["localization"];
	session: ReturnType<typeof useSession>["data"];
}) {
	const { authClient } = useAuth();
	const { mutateAsync: changePassword, isPending } = useChangePassword(
		authClient,
		{
			onError: (error) => {
				// The haveIBeenPwned plugin rejects on the password itself, so it
				// belongs against the field rather than in a toast.
				setIsCompromised(isPasswordCompromisedError(error));
			},
			onSuccess: () => {
				form.reset();
				toast.success(localization.settings.changePasswordSuccess);
			},
		},
	);

	const [isCompromised, setIsCompromised] = useState(false);

	const { validatePassword, validateConfirmation } = usePasswordValidation();
	const form = useAppForm({
		defaultValues: {
			confirmPassword: "",
			currentPassword: "",
			newPassword: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await changePassword({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
					revokeOtherSessions: true,
				});
			} catch {
				// The mutation reports the error through its configured handler.
			}
		},
	});

	return (
		<div>
			<h2 className="text-sm font-semibold mb-3">
				{localization.settings.changePassword}
			</h2>

			<form.AppForm>
				<form.FormRoot>
					<Card className={cn(className)}>
						<CardContent className="flex flex-col gap-6">
							<form.AppField
								name="currentPassword"
								validators={{
									onChange: ({ value }) =>
										validateStringLength(value, {
											requiredMessage: localization.auth.fieldRequired,
										}),
								}}
							>
								{(field) => (
									<field.FormTextField
										label={localization.settings.currentPassword}
										type="password"
										autoComplete="current-password"
										placeholder={
											localization.settings.currentPasswordPlaceholder
										}
										required
										disabled={isPending}
										isLoading={!session}
									/>
								)}
							</form.AppField>

							<form.AppField
								name="newPassword"
								validators={{
									onChange: ({ value }) => validatePassword(value),
								}}
							>
								{(field) => (
									<field.FormTextField
										label={localization.auth.newPassword}
										type="password"
										autoComplete="new-password"
										placeholder={localization.auth.newPasswordPlaceholder}
										required
										disabled={isPending}
										minLength={emailAndPassword?.minPasswordLength}
										maxLength={emailAndPassword?.maxPasswordLength}
										isLoading={!session}
										error={
											isCompromised && localization.auth.passwordCompromised
										}
										onValueChange={() => setIsCompromised(false)}
									>
										<PasswordStrengthMeter password={field.state.value} />
									</field.FormTextField>
								)}
							</form.AppField>

							{emailAndPassword.confirmPassword && (
								<form.AppField
									name="confirmPassword"
									validators={{
										onChangeListenTo: ["newPassword"],
										onChange: ({ fieldApi, value }) =>
											validateConfirmation(
												value,
												fieldApi.form.getFieldValue("newPassword"),
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
											disabled={isPending}
											minLength={emailAndPassword?.minPasswordLength}
											maxLength={emailAndPassword?.maxPasswordLength}
											isLoading={!session}
										/>
									)}
								</form.AppField>
							)}
						</CardContent>

						<CardFooter>
							<form.FormSubmitButton disabled={isPending || !session} size="sm">
								{localization.settings.updatePassword}
							</form.FormSubmitButton>
						</CardFooter>
					</Card>
				</form.FormRoot>
			</form.AppForm>
		</div>
	);
}
