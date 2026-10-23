/**
 * Single source of truth for the storefront taxonomy.
 *
 * The slug tuples feed the Postgres enums, the zod schemas and the routes.
 * Adding a department or category here also needs a migration
 * (`pnpm db:generate && pnpm db:migrate`) and an entry in `tones` in
 * `components/home/department-tiles.tsx` (a new department won't compile
 * without one).
 */
export const departmentSlugs = ["men", "women", "kids"] as const;
export type Department = (typeof departmentSlugs)[number];

export const categorySlugs = ["shoes", "clothing"] as const;
export type Category = (typeof categorySlugs)[number];

export const departments = {
	men: { label: "Men" },
	women: { label: "Women" },
	kids: { label: "Kids" },
} satisfies Record<Department, { label: string }>;

export const categories = {
	shoes: { label: "Shoes" },
	clothing: { label: "Clothing" },
} satisfies Record<Category, { label: string }>;
