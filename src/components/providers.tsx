import { Facebook01Icon, GoogleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { addressesPlugin } from "#/features/addresses/addresses-plugin";
import { authClient } from "#/features/auth/auth-client";
import { publicConfigQuery } from "#/features/config/config.queries";
import { AuthProvider } from "./auth/auth-provider";
import { Toaster } from "./ui/sonner";

const AuthLink: NonNullable<ComponentProps<typeof AuthProvider>["Link"]> = ({
	href,
	...props
}) => <Link to={href} {...props} />;

const socialProviderDisplay = {
	google: { label: "Google", icon: <HugeiconsIcon icon={GoogleIcon} /> },
	facebook: {
		label: "Facebook",
		icon: <HugeiconsIcon icon={Facebook01Icon} />,
	},
};

const plugins = [addressesPlugin];

export function Providers({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const { data: config } = useSuspenseQuery(publicConfigQuery);

	return (
		<AuthProvider
			emailAndPassword={{
				enabled: true,
				confirmPassword: true,
				forgotPassword: true,
				requireEmailVerification: true,
			}}
			authClient={authClient}
			redirectTo="/"
			socialProviders={config.socialProviders.map((id) => ({
				id,
				...socialProviderDisplay[id],
			}))}
			navigate={navigate}
			plugins={plugins}
			Link={AuthLink}
		>
			{children}
			<Toaster />
		</AuthProvider>
	);
}
