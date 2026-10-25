import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "#/features/auth/session.server";
import { translate as t } from "#/i18n/translate";
import { addressSchema } from "./address.schema";
import { AddressError, addresses } from "./address.server";

const idInput = z.object({ id: z.uuid() });

/**
 * Runs a handler as the signed-in user. Messages from `AddressError` reach the
 * shopper; anything else (a database error, say) is logged and replaced, so
 * query text never leaks into the form.
 */
async function run<T>(task: (userId: string) => Promise<T>) {
	const userId = await requireUserId();
	try {
		return await task(userId);
	} catch (error) {
		if (error instanceof AddressError) throw error;
		console.error("Address request failed:", error);
		throw new Error(t("Something went wrong. Please try again."));
	}
}

export const listAddressesFn = createServerFn({ method: "GET" }).handler(() =>
	run((userId) => addresses.list(userId)),
);

export const createAddressFn = createServerFn({ method: "POST" })
	.validator(addressSchema)
	.handler(({ data }) => run((userId) => addresses.create(userId, data)));

export const updateAddressFn = createServerFn({ method: "POST" })
	.validator(idInput.extend({ address: addressSchema }))
	.handler(({ data }) =>
		run((userId) => addresses.update(userId, data.id, data.address)),
	);

export const setPrimaryAddressFn = createServerFn({ method: "POST" })
	.validator(idInput)
	.handler(({ data }) =>
		run((userId) => addresses.setPrimary(userId, data.id)),
	);

export const deleteAddressFn = createServerFn({ method: "POST" })
	.validator(idInput)
	.handler(({ data }) => run((userId) => addresses.remove(userId, data.id)));

/** One saved address, as the account settings list it. */
export type Address = Awaited<ReturnType<typeof listAddressesFn>>[number];
