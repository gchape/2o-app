import {
	Facebook01Icon,
	InstagramIcon,
	TiktokIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

type Social = {
	label: string;
	/** Leave unset until the account exists; the footer hides entries without a link. */
	href?: string;
	icon: IconSvgElement;
};

export const socials: Social[] = [
	{ label: "Instagram", href: undefined, icon: InstagramIcon },
	{ label: "Facebook", href: undefined, icon: Facebook01Icon },
	{ label: "TikTok", href: undefined, icon: TiktokIcon },
];
