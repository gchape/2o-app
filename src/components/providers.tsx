import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { authClient } from "#/lib/auth-client";
import { AuthProvider } from "./auth/auth-provider";
import { Toaster } from "./ui/sonner";

const AuthLink: NonNullable<ComponentProps<typeof AuthProvider>["Link"]> = ({
	href,
	...props
}) => <Link to={href} {...props} />;

export function Providers({ children }: { children: ReactNode }) {
	const navigate = useNavigate();

	return (
		<AuthProvider
			emailAndPassword={{
				enabled: true,
				confirmPassword: true,
				forgotPassword: false,
			}}
			authClient={authClient}
			redirectTo="/"
			socialProviders={["google", "facebook"]}
			navigate={navigate}
			Link={AuthLink}
		>
			{children}
			<Toaster />
		</AuthProvider>
	);
}
