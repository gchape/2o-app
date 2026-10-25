import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en, fill, ka, MessagesProvider, useMessages } from "./messages";

function Copy() {
	return <span>{useMessages().verifyEmail.title}</span>;
}

describe("app messages", () => {
	it("isolates translations per provider and keeps a Georgian default", () => {
		const translated = {
			...en,
			verifyEmail: { ...en.verifyEmail, title: "Vérifiez votre e-mail" },
		};
		expect(
			renderToStaticMarkup(
				<MessagesProvider value={translated}>
					<Copy />
				</MessagesProvider>,
			),
		).toContain(translated.verifyEmail.title);
		expect(renderToStaticMarkup(<Copy />)).toContain(ka.verifyEmail.title);
	});

	it("interpolates repeated values and zero without rewriting missing placeholders", () => {
		expect(
			fill("{{seconds}} / {{seconds}} / {{missing}}", { seconds: 0 }),
		).toBe("0 / 0 / {{missing}}");
	});

	it("does not interpret user-supplied replacement syntax or HTML", () => {
		const email = "$&<script>";
		expect(fill("Code for {{email}}", { email })).toBe(`Code for ${email}`);
		expect(
			renderToStaticMarkup(
				<span>{fill("Code for {{email}}", { email })}</span>,
			),
		).not.toContain("<script>");
	});
});
