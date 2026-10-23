import { escape as escapeHtml } from "es-toolkit";
import { Resend } from "resend";
import { env } from "#/server/env.server";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type Email = { subject: string; html: string };

export async function sendEmail({ to, subject, html }: Email & { to: string }) {
	if (!resend) {
		// Only reachable in development; production requires the key.
		console.info(`[email not sent] to=${to} subject=${subject}\n${html}`);
		return;
	}

	const { error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
	});

	if (error) console.error("Failed to send email:", error);
}

/** Transactional email bodies, kept out of the auth configuration. */
export const emailTemplates = {
	resetPassword: (url: string): Email => ({
		subject: "Reset your password",
		html: `<p>Click <a href="${escapeHtml(url)}">here</a> to reset your password. If you didn't request this, ignore this email.</p>`,
	}),

	approveEmailChange: (newEmail: string, url: string): Email => ({
		subject: "Approve your email change",
		html: `<p>You asked to change your email to ${escapeHtml(newEmail)}. <a href="${escapeHtml(url)}">Approve the change</a>. If this wasn't you, ignore this email.</p>`,
	}),
};
