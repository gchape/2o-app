import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { authClient } from "#/features/auth/auth.client";
import { publicConfigQuery } from "#/features/config/config.queries";
import { AuthProvider } from "./auth/auth-provider";
import { Toaster } from "./ui/sonner";

const AuthLink: NonNullable<ComponentProps<typeof AuthProvider>["Link"]> = ({
	href,
	...props
}) => <Link to={href} {...props} />;

export function Providers({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const { data: config } = useSuspenseQuery(publicConfigQuery);

	return (
		<AuthProvider
			emailAndPassword={{
				enabled: true,
				confirmPassword: true,
				forgotPassword: false,
			}}
			authClient={authClient}
			redirectTo="/"
			socialProviders={config.socialProviders}
			navigate={navigate}
			Link={AuthLink}
		>
			{children}
			<Toaster />
		</AuthProvider>
	);
}
