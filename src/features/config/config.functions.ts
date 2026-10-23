import { createServerFn } from "@tanstack/react-start";
import { getPublicConfig } from "./config.server";

export const getPublicConfigFn = createServerFn({ method: "GET" }).handler(() =>
	getPublicConfig(),
);
