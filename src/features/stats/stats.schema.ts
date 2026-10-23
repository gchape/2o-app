import { z } from "zod";

/** Numbers for the home hero and /deals, from the latest price check. */
export const statsSchema = z.object({
	deals: z.number().int().nonnegative(),
	warehouses: z.number().int().nonnegative(),
	/** ISO timestamp of when prices were last checked. */
	checkedAt: z.string().nullable(),
});

export type Stats = z.infer<typeof statsSchema>;
