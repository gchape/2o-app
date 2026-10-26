import { describe, expect, it } from "vitest";
import { MAX_PROOF_BYTES } from "./checkout";
import { readPaymentProof } from "./payment-proof.server";

const png = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9U8AAAAASUVORK5CYII=",
	"base64",
);
describe("private payment proof validation", () => {
	it("accepts a PNG by its actual signature", async () => {
		expect(
			await readPaymentProof(
				new File([png], "receipt.png", { type: "image/png" }),
			),
		).toEqual({ base64: png.toString("base64"), type: "image/png" });
	});
	it("rejects spoofed MIME types, HTML, empty and oversized files", async () => {
		for (const file of [
			new File([png], "receipt.jpg", { type: "image/jpeg" }),
			new File(["<script>alert(1)</script>"], "receipt.png", {
				type: "image/png",
			}),
			new File([], "receipt.png", { type: "image/png" }),
			new File([new Uint8Array(MAX_PROOF_BYTES + 1)], "receipt.png", {
				type: "image/png",
			}),
		]) {
			await expect(readPaymentProof(file)).rejects.toThrow();
		}
	});
});
