import { z } from "zod";
import { categorySlugs, departmentSlugs } from "#/data/catalog";

export const departmentSchema = z.enum(departmentSlugs);
export const categorySchema = z.enum(categorySlugs);

export const productSlugSchema = z.string().min(1).max(200);
