import { createServerFn } from "@tanstack/react-start";
import { getStats } from "./stats.server";

export const getStatsFn = createServerFn({ method: "GET" }).handler(() =>
	getStats(),
);
