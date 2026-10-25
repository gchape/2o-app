import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { fill, useMessages } from "#/i18n/messages";

export function ResendCodeButton({
	onResend,
	disabled,
}: {
	onResend: () => Promise<unknown>;
	disabled?: boolean;
}) {
	const messages = useMessages();
	const [cooldown, setCooldown] = useState(60);
	const resend = useMutation({
		mutationFn: onResend,
		onSuccess: () => {
			setCooldown(60);
			toast.success(messages.otp.resent);
		},
		onError: () => toast.error(messages.otp.resendFailed),
	});

	useEffect(() => {
		if (cooldown === 0) return;
		const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	return (
		<Button
			type="button"
			variant="outline"
			disabled={disabled || cooldown > 0 || resend.isPending}
			onClick={() => resend.mutate()}
		>
			{resend.isPending && <Spinner />}
			{cooldown > 0
				? fill(messages.otp.resendIn, { seconds: cooldown })
				: messages.otp.resend}
		</Button>
	);
}
