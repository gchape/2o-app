import { z } from "zod";
import { categorySlugs } from "#/data/categories";
import { departmentSlugs } from "#/data/departments";

export const departmentSchema = z.enum(departmentSlugs);
export type Department = z.infer<typeof departmentSchema>;

export const categorySchema = z.enum(categorySlugs);
export type Category = z.infer<typeof categorySchema>;

export const productFiltersSchema = z.object({
	department: departmentSchema,
	category: categorySchema.optional(),
});

export const productSlugSchema = z.string().min(1).max(200);
