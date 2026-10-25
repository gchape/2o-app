import { defineConfig } from "vitest/config";

// Unit tests exercise source modules and mock HTTP boundaries. Start and Nitro
// transforms belong to the application build, where they generate real RPCs.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
	},
});
