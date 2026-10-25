import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useAppForm } from "#/components/form/app-form";
import { en, MessagesProvider } from "#/i18n/messages";

function ExampleForm({ error }: { error?: string }) {
	const form = useAppForm({ defaultValues: { password: "secret" } });
	return (
		<form.AppForm>
			<form.AppField name="password">
				{(field) => (
					<field.FormTextField
						type="password"
						label="Password"
						description="At least 8 characters"
						error={error}
					/>
				)}
			</form.AppField>
		</form.AppForm>
	);
}

describe("composed form fields", () => {
	it("uses translated password controls without an auth provider", () => {
		const html = renderToStaticMarkup(
			<MessagesProvider
				value={{
					...en,
					form: { ...en.form, showPassword: "Afficher le mot de passe" },
				}}
			>
				<ExampleForm />
			</MessagesProvider>,
		);
		expect(html).toContain('aria-label="Afficher le mot de passe"');
	});

	it("preserves the password input and visibility control", () => {
		const html = renderToStaticMarkup(<ExampleForm />);
		expect(html).toContain('type="password"');
		expect(html).toContain('name="password"');
		expect(html).toContain('value="secret"');
		expect(html).toContain('aria-label="პაროლის ჩვენება"');
	});

	it("connects labels, help, and server errors to distinct fields in multiple forms", () => {
		const html = renderToStaticMarkup(
			<>
				<ExampleForm error="Choose a different password" />
				<ExampleForm />
			</>,
		);
		const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(
			([input]) => input,
		);
		expect(inputs).toHaveLength(2);
		const ids = inputs.map((input) => /\bid="([^"]+)"/.exec(input)?.[1]);
		expect(new Set(ids).size).toBe(2);
		for (const id of ids) {
			expect(id).toBeTruthy();
			expect(html).toContain(`for="${id}"`);
			expect(html).toContain(`id="${id}-description"`);
		}
		expect(inputs[0]).toContain('aria-invalid="true"');
		expect(inputs[0]).toContain(
			`aria-describedby="${ids[0]}-description ${ids[0]}-error"`,
		);
		expect(html).toContain(`id="${ids[0]}-error"`);
		expect(html).toContain("Choose a different password");
		expect(inputs[1]).toContain('aria-invalid="false"');
	});
});
