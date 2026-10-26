import { useAuth } from "@better-auth-ui/react";
import { useVerifyEmailOtp } from "@better-auth-ui/react/plugins/email-otp";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "#/components/form/app-form";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldDescription, FieldGroup } from "#/components/ui/field";
import { authClient } from "#/features/auth/auth-client";
import { fill, useMessages } from "#/i18n/messages";
import { cn } from "#/lib/utils";
import { ResendCodeButton } from "./resend-code-button";
import { VERIFY_EMAIL_STORAGE_KEY } from "./storage-keys";
import { useStoredEmail } from "./use-stored-email";

export type VerifyEmailProps = { className?: string };

export function VerifyEmail({ className }: VerifyEmailProps) {
	const { basePaths, viewPaths, navigate } = useAuth();
	const messages = useMessages();
	const email = useStoredEmail(VERIFY_EMAIL_STORAGE_KEY);
	const verify = useVerifyEmailOtp(authClient, {
		onSuccess: () => {
			sessionStorage.removeItem(VERIFY_EMAIL_STORAGE_KEY);
			toast.success(messages.verifyEmail.success);
			navigate({ to: `${basePaths.auth}/${viewPaths.auth.signIn}` });
		},
	});
	const form = useAppForm({
		defaultValues: { otp: "" },
		onSubmit: async ({ value }) => {
			await verify.mutateAsync({ email, otp: value.otp });
		},
	});

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					{messages.verifyEmail.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{email ? (
					<form.AppForm>
						<form.FormRoot>
							<FieldGroup>
								<FieldDescription>
									{fill(messages.verifyEmail.instructions, { email })}
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
											label={messages.verifyEmail.codeLabel}
											inputMode="numeric"
											autoComplete="one-time-code"
											maxLength={6}
											required
											disabled={verify.isPending}
										/>
									)}
								</form.AppField>
								<form.FormServerError />
								<form.FormSubmitButton isPending={verify.isPending}>
									{messages.verifyEmail.submit}
								</form.FormSubmitButton>
								<ResendCodeButton
									disabled={verify.isPending}
									onResend={async () => {
										const { error } =
											await authClient.emailOtp.sendVerificationOtp({
												email,
												type: "email-verification",
											});
										if (error) throw new Error(error.message);
									}}
								/>
							</FieldGroup>
						</form.FormRoot>
					</form.AppForm>
				) : (
					<FieldDescription>{messages.verifyEmail.noEmail}</FieldDescription>
				)}
			</CardContent>
		</Card>
	);
}
