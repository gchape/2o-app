import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "#/db";
import { address, user } from "#/db/schema";
import { translate as t } from "#/i18n/translate";
import { type AddressInput, MAX_ADDRESSES } from "./address.schema";

/** An error whose message is meant for the shopper; anything else is hidden behind a generic one. */
export class AddressError extends Error {}

function ensure(condition: unknown, message: string): asserts condition {
	if (!condition) throw new AddressError(message);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** What the browser may see: never the owner or the timestamps. */
const publicColumns = {
	id: address.id,
	fullName: address.fullName,
	phone: address.phone,
	line1: address.line1,
	line2: address.line2,
	city: address.city,
	state: address.state,
	postalCode: address.postalCode,
	country: address.country,
	isPrimary: address.isPrimary,
};

type AddressFields = Omit<AddressInput, "isPrimary">;

/** Empty optional fields are stored as null. */
const toRow = (fields: AddressFields) => ({
	...fields,
	line2: fields.line2 || null,
});

const mine = (userId: string, id: string) =>
	and(eq(address.id, id), eq(address.userId, userId));

/**
 * Takes a row lock on the owner for the rest of the transaction, so one
 * account's address changes run one at a time. That keeps the address limit
 * and the single primary true even when two requests race.
 */
const lockOwner = (tx: Tx, userId: string) =>
	tx
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, userId))
		.for("update");

/** Frees the primary slot first: the partial unique index allows only one primary per user. */
const demotePrimary = (tx: Tx, userId: string) =>
	tx
		.update(address)
		.set({ isPrimary: false })
		.where(and(eq(address.userId, userId), eq(address.isPrimary, true)));

export const addresses = {
	/** The primary address first, then the rest in the order they were added. */
	async list(userId: string) {
		return db
			.select(publicColumns)
			.from(address)
			.where(eq(address.userId, userId))
			.orderBy(
				desc(address.isPrimary),
				asc(address.createdAt),
				asc(address.id),
			);
	},

	async create(userId: string, { isPrimary, ...fields }: AddressInput) {
		await db.transaction(async (tx) => {
			await lockOwner(tx, userId);

			const existing = await tx
				.select({ id: address.id })
				.from(address)
				.where(eq(address.userId, userId));
			ensure(
				existing.length < MAX_ADDRESSES,
				t("You can save up to {{max}} addresses.", { max: MAX_ADDRESSES }),
			);

			// The first address is primary automatically.
			const primary = isPrimary || existing.length === 0;
			if (primary) await demotePrimary(tx, userId);

			await tx
				.insert(address)
				.values({ ...toRow(fields), userId, isPrimary: primary });
		});
	},

	async update(
		userId: string,
		id: string,
		{ isPrimary, ...fields }: AddressInput,
	) {
		await db.transaction(async (tx) => {
			await lockOwner(tx, userId);

			const [current] = await tx
				.select({ isPrimary: address.isPrimary })
				.from(address)
				.where(mine(userId, id));
			ensure(current, t("That address no longer exists."));

			// An account always keeps a primary address, so unticking it here does
			// nothing; picking another address as primary is how it moves.
			const promote = isPrimary && !current.isPrimary;
			if (promote) await demotePrimary(tx, userId);

			await tx
				.update(address)
				.set({ ...toRow(fields), ...(promote && { isPrimary: true }) })
				.where(mine(userId, id));
		});
	},

	async setPrimary(userId: string, id: string) {
		await db.transaction(async (tx) => {
			await lockOwner(tx, userId);

			const [target] = await tx
				.select({ isPrimary: address.isPrimary })
				.from(address)
				.where(mine(userId, id));
			ensure(target, t("That address no longer exists."));
			if (target.isPrimary) return;

			await demotePrimary(tx, userId);
			await tx.update(address).set({ isPrimary: true }).where(mine(userId, id));
		});
	},

	async remove(userId: string, id: string) {
		await db.transaction(async (tx) => {
			await lockOwner(tx, userId);

			const [removed] = await tx
				.delete(address)
				.where(mine(userId, id))
				.returning({ isPrimary: address.isPrimary });
			if (!removed?.isPrimary) return;

			// Never leave an account without a primary while it still has addresses.
			const [next] = await tx
				.select({ id: address.id })
				.from(address)
				.where(eq(address.userId, userId))
				.orderBy(asc(address.createdAt), asc(address.id))
				.limit(1);
			if (next) {
				await tx
					.update(address)
					.set({ isPrimary: true })
					.where(eq(address.id, next.id));
			}
		});
	},
};
