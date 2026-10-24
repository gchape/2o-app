import { useAuth } from "@better-auth-ui/react";
import { type ComponentProps, useState } from "react";
import { Eye, EyeOff } from "#/components/icons";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";

export type PasswordInputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	"type"
>;

/**
 * Password field with a show/hide toggle. Owns its own visibility state, so
 * forms with several password fields (new + confirm) need no extra state.
 */
export function PasswordInput(props: PasswordInputProps) {
	const { localization } = useAuth();
	const [visible, setVisible] = useState(false);
	const label = visible
		? localization.auth.hidePassword
		: localization.auth.showPassword;

	return (
		<InputGroup>
			<InputGroupInput {...props} type={visible ? "text" : "password"} />

			<InputGroupAddon align="inline-end">
				<InputGroupButton
					size="icon-xs"
					aria-label={label}
					title={label}
					onClick={() => setVisible((v) => !v)}
				>
					{visible ? <EyeOff /> : <Eye />}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}
