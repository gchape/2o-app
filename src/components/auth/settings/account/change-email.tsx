import { getViewURL, validateEmailAddress } from "@better-auth-ui/core";
import { useAuth, useChangeEmail, useSession } from "@better-auth-ui/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAppForm } from "#/components/form/app-form";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import { cn } from "#/lib/utils";

export type ChangeEmailProps = {
	className?: string;
};

/**
 * Render a card containing a form to view and update the authenticated user's email.
 *
 * Shows a loading skeleton until session data is available, displays the current
 * email as the form's default value, and sends a verification email to the
 * new address upon successful submission.
 *
 * @returns A JSX element rendering the change-email card and form
 */
export function ChangeEmail({ className }: ChangeEmailProps) {
	const { authClient, basePaths, baseURL, localization, viewPaths } = useAuth();
	const { data: session } = useSession(authClient);

	const { mutateAsync: changeEmail, isPending } = useChangeEmail(authClient, {
		onSuccess: () => toast.success(localization.settings.changeEmailSuccess),
	});

	const form = useAppForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) =>
			await changeEmail({
				callbackURL: getViewURL(
					baseURL,
					basePaths.settings,
					viewPaths.settings.account,
				),
				newEmail: value.email,
			}),
	});

	useEffect(() => {
		if (session) form.reset({ email: session.user.email });
	}, [form, session]);

	return (
		<div>
			<h2 className="text-sm font-semibold mb-3">
				{localization.settings.changeEmail}
			</h2>

			<form.AppForm>
				<form.FormRoot>
					<Card className={cn(className)}>
						<CardContent className="flex flex-col gap-6">
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
									<field.FormTextField
										label={localization.auth.email}
										autoComplete="email"
										placeholder={localization.auth.emailPlaceholder}
										disabled={isPending}
										isLoading={!session}
										type="email"
										required
									/>
								)}
							</form.AppField>
							<form.FormServerError />
						</CardContent>

						<CardFooter>
							<form.FormSubmitButton
								isPending={isPending}
								size="sm"
								disabled={isPending || !session}
							>
								{localization.settings.updateEmail}
							</form.FormSubmitButton>
						</CardFooter>
					</Card>
				</form.FormRoot>
			</form.AppForm>
		</div>
	);
}
