import { defaultAuthLocale } from "@better-auth-ui/core";
import { Facebook01Icon, GoogleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { addressesPlugin } from "#/features/addresses/addresses-plugin";
import { authClient } from "#/features/auth/auth-client";
import { publicConfigQuery } from "#/features/config/config.queries";
import { georgianAuthLocale } from "#/i18n/auth-ka";
import { DEFAULT_LOCALE, type Locale, LocaleProvider } from "#/i18n/locale";
import { en, ka, type Messages, MessagesProvider } from "#/i18n/messages";
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

export function Providers({
	children,
	locale = DEFAULT_LOCALE,
	messages = locale === "ka" ? ka : en,
	localization,
}: {
	children: ReactNode;
	locale?: Locale;
	messages?: Messages;
	localization?: ComponentProps<typeof AuthProvider>["localization"];
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: config } = useSuspenseQuery(publicConfigQuery);

	return (
		<LocaleProvider value={locale}>
			<MessagesProvider value={messages}>
				<AuthProvider
					locale={locale === "ka" ? georgianAuthLocale : defaultAuthLocale}
					localization={localization}
					emailAndPassword={{
						enabled: true,
						confirmPassword: true,
						forgotPassword: true,
						requireEmailVerification: true,
					}}
					authClient={authClient}
					queryClient={queryClient}
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
			</MessagesProvider>
		</LocaleProvider>
	);
}
