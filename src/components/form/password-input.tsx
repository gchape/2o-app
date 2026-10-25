import { type ComponentProps, useState } from "react";
import { Eye, EyeOff } from "#/components/icons";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import { useMessages } from "#/i18n/messages";

export type PasswordInputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	"type"
>;

/**
 * Password field with a show/hide toggle. Owns its own visibility state, so
 * forms with several password fields (new + confirm) need no extra state.
 */
export function PasswordInput(props: PasswordInputProps) {
	const messages = useMessages();
	const [visible, setVisible] = useState(false);
	const label = visible
		? messages.form.hidePassword
		: messages.form.showPassword;

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
