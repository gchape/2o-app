import { useAuth, useSession } from "@better-auth-ui/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserButton } from "#/components/auth/user/user-button";
import { LinkButton } from "#/components/link-button";
import { useTranslation } from "#/i18n/translate";

/** "Sign in" for guests, the account menu once there is a session. */
export function AccountLink() {
	const t = useTranslation();
	const { authClient, viewPaths } = useAuth();
	const { data: session } = useSession(authClient);

	if (session) return <UserButton size="icon" />;

	return (
		<LinkButton
			to="/auth/$path"
			params={{ path: viewPaths.auth.signIn }}
			variant="ghost"
			className="gap-2 px-2.5"
			aria-label={t("Sign in")}
		>
			<HugeiconsIcon icon={UserIcon} size={18} />
			<span className="hidden sm:inline">{t("Sign in")}</span>
		</LinkButton>
	);
}
