import { MAX_PROOF_BYTES, PROOF_TYPES } from "./checkout";

export async function readPaymentProof(file: File) {
	if (
		!file.size ||
		file.size > MAX_PROOF_BYTES ||
		!PROOF_TYPES.includes(file.type)
	)
		throw new Error("Use a PNG, JPEG or WebP image up to 2 MB.");
	const bytes = Buffer.from(await file.arrayBuffer());
	const png = bytes
		.subarray(0, 8)
		.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
	const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
	const webp =
		bytes.toString("ascii", 0, 4) === "RIFF" &&
		bytes.toString("ascii", 8, 12) === "WEBP";
	const type = png
		? "image/png"
		: jpeg
			? "image/jpeg"
			: webp
				? "image/webp"
				: null;
	if (type !== file.type || bytes.length < 32)
		throw new Error("Use a PNG, JPEG or WebP image up to 2 MB.");
	return { base64: bytes.toString("base64"), type };
}
