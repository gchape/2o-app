export const en = {
	form: {
		submitFailed: "Unable to submit this form. Try again.",
		showPassword: "Show password",
		hidePassword: "Hide password",
		noItems: "No items found.",
	},
	session: {
		unknownBrowser: "Unknown Browser",
	},
	otp: {
		invalidCode: "Enter the six-digit code",
		resend: "Resend code",
		resendIn: "Resend in {{seconds}}s",
		resent: "A new code has been sent if the email is eligible.",
		resendFailed: "Couldn't send a code. Please try again.",
	},
	forgotPassword: {
		sendCode: "Send reset code",
	},
	resetPassword: {
		codeLabel: "Reset code",
		instructions: "Enter the code sent to {{email}} and choose a new password.",
		noEmail: "Request a reset code first using Forgot password.",
		useAnotherEmail: "Request a code for another email",
	},
	verifyEmail: {
		title: "Verify your email",
		instructions:
			"Enter the six-digit code sent to {{email}}. It expires in 5 minutes.",
		noEmail: "Sign in or create an account to request a verification code.",
		codeLabel: "Verification code",
		submit: "Verify email",
		success: "Email verified. You can now sign in.",
		backToSignIn: "Back to sign in",
	},
};

export type Messages = typeof en;
