import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";

export function ResendCodeButton({
	onResend,
	disabled,
}: {
	onResend: () => Promise<unknown>;
	disabled?: boolean;
}) {
	const [cooldown, setCooldown] = useState(60);
	const resend = useMutation({
		mutationFn: onResend,
		onSuccess: () => {
			setCooldown(60);
			toast.success("A new code has been sent if the email is eligible.");
		},
		onError: () => toast.error("Couldn't send a code. Please try again."),
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
			{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
		</Button>
	);
}
