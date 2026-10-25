import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth.server";

/** The signed-in user's id. Throws for guests, so a handler can't run without one. */
export async function requireUserId() {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!session) throw new Error("Please sign in to continue.");
	return session.user.id;
}
