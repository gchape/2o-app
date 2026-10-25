import { useAuth, useRevokeSession, useSession } from "@better-auth-ui/react";
import type { Session } from "better-auth";
import Bowser from "bowser";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { LogOut, Monitor, Smartphone, X } from "#/components/icons";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "#/components/ui/item";
import { Spinner } from "#/components/ui/spinner";
import { dateLocales, useLocale } from "#/i18n/locale";
import { useMessages } from "#/i18n/messages";

export type ActiveSessionProps = {
	activeSession: Session;
};

/**
 * Render a single active session row with device info and revoke control.
 *
 * Shows the session's browser, OS, and creation time. The current session is marked
 * and navigates to sign-out on click, while other sessions can be revoked individually.
 *
 * @param session - The session object containing id, token, userAgent, ipAddress, and createdAt
 * @returns A JSX element containing the active session row
 */
export function ActiveSession({ activeSession }: ActiveSessionProps) {
	const messages = useMessages();
	const locale = useLocale();
	const { authClient, basePaths, localization, viewPaths, navigate } =
		useAuth();
	const { data: session } = useSession(authClient, { refetchOnMount: false });

	const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession(
		authClient,
		{
			onSuccess: () =>
				toast.success(localization.settings.revokeSessionSuccess),
		},
	);

	const isCurrentSession = activeSession.token === session?.session.token;
	const ua = activeSession.userAgent
		? Bowser.parse(activeSession.userAgent)
		: undefined;
	const isMobile =
		ua?.platform.type === "mobile" || ua?.platform.type === "tablet";

	return (
		<Item>
			<ItemMedia variant="icon">
				{isMobile ? <Smartphone /> : <Monitor />}
			</ItemMedia>
			<ItemContent>
				<ItemTitle>
					{ua?.browser.name || messages.session.unknownBrowser}
					{ua?.os.name ? `, ${ua.os.name}` : ""}
				</ItemTitle>
				{isCurrentSession ? (
					<Badge variant="secondary">
						{localization.settings.currentSession}
					</Badge>
				) : (
					activeSession.createdAt && (
						<ItemDescription className="capitalize">
							{formatDistanceToNow(activeSession.createdAt, {
								addSuffix: true,
								locale: dateLocales[locale],
							})}
						</ItemDescription>
					)
				)}
			</ItemContent>
			<ItemActions>
				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						isCurrentSession
							? navigate({
									to: `${basePaths.auth}/${viewPaths.auth.signOut}`,
								})
							: revokeSession(activeSession)
					}
					disabled={isRevoking}
					aria-label={
						isCurrentSession
							? localization.auth.signOut
							: localization.settings.revokeSession
					}
				>
					{isRevoking ? <Spinner /> : isCurrentSession ? <LogOut /> : <X />}

					{isCurrentSession
						? localization.auth.signOut
						: localization.settings.revoke}
				</Button>
			</ItemActions>
		</Item>
	);
}
