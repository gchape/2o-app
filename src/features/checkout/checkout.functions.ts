import { createServerFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequestHeaders,
	setResponseHeader,
} from "@tanstack/react-start/server";
import { z } from "zod";
import { addresses } from "#/features/addresses/address.server";
import { auth } from "#/features/auth/auth.server";
import { requireUserId } from "#/features/auth/session.server";
import { translate } from "#/i18n/translate";
import {
	CheckoutError,
	getCheckout,
	prepareCheckout,
	submitCheckout,
	uploadProof,
} from "./checkout.server";
import { checkoutPricing } from "./checkout-config.server";

const idInput = z.object({ id: z.uuid() });
async function run<T>(task: (userId: string) => Promise<T>) {
	setResponseHeader("Cache-Control", "private, no-store");
	const userId = await requireUserId();
	try {
		return await task(userId);
	} catch (error) {
		const message =
			error instanceof CheckoutError
				? error.message
				: "Something went wrong. Please try again.";
		if (!(error instanceof CheckoutError))
			console.error("Checkout request failed");
		throw new Error(
			translate(message, {}, getCookie("2o-locale") === "en" ? "en" : "ka"),
		);
	}
}

export const checkoutPageFn = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.uuid().optional() }))
	.handler(async ({ data }) => {
		setResponseHeader("Cache-Control", "private, no-store");
		const session = await auth.api.getSession({ headers: getRequestHeaders() });
		if (!session)
			return { userId: null, ready: false, addresses: [], checkout: null };
		return run(async (userId) => {
			const [ready, savedAddresses, checkout] = await Promise.all([
				data.id ? true : checkoutPricing().then(Boolean),
				addresses.list(userId),
				data.id ? getCheckout(userId, data.id) : null,
			]);
			return { userId, ready, addresses: savedAddresses, checkout };
		});
	});

export const prepareCheckoutFn = createServerFn({ method: "POST" })
	.validator(idInput.extend({ addressId: z.uuid() }))
	.handler(({ data }) =>
		run((userId) => prepareCheckout(userId, data.id, data.addressId)),
	);

export const uploadProofFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => {
		if (!(data instanceof FormData)) throw new Error("Invalid upload");
		const id = z.uuid().parse(data.get("id"));
		const file = data.get("file");
		if (!(file instanceof File)) throw new Error("Invalid upload");
		return { id, file };
	})
	.handler(({ data }) =>
		run((userId) => uploadProof(userId, data.id, data.file)),
	);

export const submitCheckoutFn = createServerFn({ method: "POST" })
	.validator(idInput)
	.handler(({ data }) => run((userId) => submitCheckout(userId, data.id)));
