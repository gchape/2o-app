import { useAuth } from "@better-auth-ui/react";
import { useVerifyEmailOtp } from "@better-auth-ui/react/plugins/email-otp";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { FieldDescription, FieldGroup } from "#/components/ui/field";
import { authClient } from "#/features/auth/auth-client";
import { cn } from "#/lib/utils";
import { useAuthForm } from "./auth-form";
import { ResendCodeButton } from "./resend-code-button";
import { VERIFY_EMAIL_STORAGE_KEY } from "./storage-keys";
import { useStoredEmail } from "./use-stored-email";

export type VerifyEmailProps = { className?: string };

export function VerifyEmail({ className }: VerifyEmailProps) {
	const { basePaths, viewPaths, navigate, Link } = useAuth();
	const email = useStoredEmail(VERIFY_EMAIL_STORAGE_KEY);
	const verify = useVerifyEmailOtp(authClient, {
		onSuccess: () => {
			sessionStorage.removeItem(VERIFY_EMAIL_STORAGE_KEY);
			toast.success("Email verified. You can now sign in.");
			navigate({ to: `${basePaths.auth}/${viewPaths.auth.signIn}` });
		},
	});
	const form = useAuthForm({
		defaultValues: { otp: "" },
		onSubmit: async ({ value }) => {
			await verify.mutateAsync({ email, otp: value.otp });
		},
	});

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					Verify your email
				</CardTitle>
			</CardHeader>
			<CardContent>
				{email ? (
					<form.AppForm>
						<form.AuthFormRoot>
							<FieldGroup>
								<FieldDescription>
									Enter the six-digit code sent to {email}. It expires in 5
									minutes.
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
											label="Verification code"
											inputMode="numeric"
											autoComplete="one-time-code"
											maxLength={6}
											required
											disabled={verify.isPending}
										/>
									)}
								</form.AppField>
								<form.AuthFormServerError />
								<form.AuthFormSubmitButton isPending={verify.isPending}>
									Verify email
								</form.AuthFormSubmitButton>
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
						</form.AuthFormRoot>
					</form.AppForm>
				) : (
					<FieldDescription>
						Sign in or create an account to request a verification code.
					</FieldDescription>
				)}
				<FieldDescription className="mt-4 text-center">
					<Link
						href={`${basePaths.auth}/${viewPaths.auth.signIn}`}
						className="underline underline-offset-4"
					>
						Back to sign in
					</Link>
				</FieldDescription>
			</CardContent>
		</Card>
	);
}
