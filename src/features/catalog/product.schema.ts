import { z } from "zod";

export const productSlugSchema = z.string().min(1).max(200);
