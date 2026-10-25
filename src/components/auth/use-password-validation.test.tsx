import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { usePasswordValidation } from "./use-password-validation";

vi.mock("@better-auth-ui/react", () => ({
	useAuth: () => ({
		emailAndPassword: { minPasswordLength: 8, maxPasswordLength: 12 },
		localization: {
			auth: {
				fieldRequired: "Obligatoire",
				tooShort: "Minimum {{min}} caractères",
				tooLong: "Maximum {{max}} caractères",
				passwordsDoNotMatch: "Les mots de passe diffèrent",
			},
		},
	}),
}));

function ValidationProbe({
	password,
	confirmation,
	report,
}: {
	password: string;
	confirmation?: string;
	report: (error: string | undefined) => void;
}) {
	const { validatePassword, validateConfirmation } = usePasswordValidation();
	report(
		(confirmation === undefined
			? validatePassword(password)
			: validateConfirmation(confirmation, password)
		)?.message,
	);
	return null;
}

function validate(password: string, confirmation?: string) {
	let result: string | undefined;
	renderToStaticMarkup(
		<ValidationProbe
			password={password}
			confirmation={confirmation}
			report={(error) => {
				result = error;
			}}
		/>,
	);
	return result;
}

describe("shared password policy", () => {
	it("uses configured limits and localized errors", () => {
		expect(validate("")).toBe("Obligatoire");
		expect(validate("1234567")).toBe("Minimum 8 caractères");
		expect(validate("1234567890123")).toBe("Maximum 12 caractères");
		expect(validate("12345678")).toBeUndefined();
		expect(validate("123456789012")).toBeUndefined();
	});

	it("validates confirmation length before comparing passwords", () => {
		expect(validate("12345678", "")).toBe("Obligatoire");
		expect(validate("12345678", "1234567")).toBe("Minimum 8 caractères");
		expect(validate("12345678", "abcdefgh")).toBe(
			"Les mots de passe diffèrent",
		);
		expect(validate("12345678", "12345678")).toBeUndefined();
	});

	it("preserves spaces in a password", () => {
		expect(validate(" 123456 ")).toBeUndefined();
		expect(validate(" 123456 ", "123456  ")).toBe(
			"Les mots de passe diffèrent",
		);
	});
});
