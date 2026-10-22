export const departmentSlugs = ["men", "women", "kids"] as const;

export const images = {
	men: "/images/men.webp",
	women: "/images/women.webp",
	kids: "/images/kids.webp",
} satisfies Record<(typeof departmentSlugs)[number], string>;
