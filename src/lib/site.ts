import {
	Facebook01Icon,
	InstagramIcon,
	TiktokIcon,
} from "@hugeicons/core-free-icons";

export const socials = [
	{
		label: "Instagram",
		href: "https://www.instagram.com/your-handle",
		icon: InstagramIcon,
	},
	{
		label: "Facebook",
		href: "https://www.facebook.com/your-page",
		icon: Facebook01Icon,
	},
	{
		label: "TikTok",
		href: "https://www.tiktok.com/@your-handle",
		icon: TiktokIcon,
	},
];

export const departments = [
	{ slug: "men", label: "Men" },
	{ slug: "women", label: "Women" },
	{ slug: "kids", label: "Kids" },
] as const;

export type DepartmentSlug = (typeof departments)[number]["slug"];
