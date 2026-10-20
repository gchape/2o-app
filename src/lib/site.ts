import {
	Clock,
	Facebook01Icon,
	InstagramIcon,
	MessageCircle,
	Shirt,
	Sparkles,
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

export const slides = [
	{
		title: "Shoes for little feet",
		text: "Comfy, colorful pairs at prices parents love.",
		cta: "Shop kids' shoes",
		department: "kids",
		category: "shoes",
		tone: "brand",
	},
	{
		title: "Run further, spend less",
		text: "Women's running shoes, priced to move.",
		cta: "Shop running shoes",
		department: "women",
		category: "shoes",
		tone: "dark",
	},
	{
		title: "Men's sneakers",
		text: "Find your next pair at today's lowest price.",
		cta: "Shop sneakers",
		department: "men",
		category: "shoes",
		tone: "brand",
	},
] as const;

export const messages = [
	{ icon: Sparkles, text: "New deals added every morning" },
	{
		icon: MessageCircle,
		text: "Questions about sizes or orders? Chat with us",
	},
	{ icon: Shirt, text: "Shop kids, women and men" },
	{ icon: Clock, text: "Prices can change, so grab your deal early" },
];
