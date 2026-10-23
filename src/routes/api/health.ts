import { createFileRoute } from "@tanstack/react-router";

/** Liveness probe for the container healthcheck; deliberately touches nothing else. */
export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: () => Response.json({ status: "ok" }),
		},
	},
});
