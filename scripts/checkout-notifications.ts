import {
	cleanExpiredDrafts,
	deliverOrderNotification,
} from "../src/features/checkout/telegram.server";

let stopping = false;
process.on("SIGTERM", () => {
	stopping = true;
});
process.on("SIGINT", () => {
	stopping = true;
});
let lastCleanup = 0;
while (!stopping) {
	try {
		if (Date.now() - lastCleanup > 24 * 60 * 60 * 1000) {
			await cleanExpiredDrafts();
			lastCleanup = Date.now();
		}
		const processed = await deliverOrderNotification();
		if (processed) continue;
	} catch {
		console.error("Order notification worker failed; retrying");
	}
	await new Promise((resolve) => setTimeout(resolve, 5_000));
}
process.exit(0);
