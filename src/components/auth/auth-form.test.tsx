import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useAuthForm } from "./auth-form";

vi.mock("@better-auth-ui/react", () => ({
	useAuth: () => ({
		localization: {
			auth: { showPassword: "Show password", hidePassword: "Hide password" },
		},
	}),
}));

function ExampleForm({ error }: { error?: string }) {
	const form = useAuthForm({ defaultValues: { password: "secret" } });
	return (
		<form.AppForm>
			<form.AppField name="password">
				{(field) => (
					<field.AuthFormTextField
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
	it("preserves the password input and visibility control", () => {
		const html = renderToStaticMarkup(<ExampleForm />);
		expect(html).toContain('type="password"');
		expect(html).toContain('name="password"');
		expect(html).toContain('value="secret"');
		expect(html).toContain('aria-label="Show password"');
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
