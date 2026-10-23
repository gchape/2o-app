import {
	Clock01Icon,
	DeliveryTruck01Icon,
	Message01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { site } from "#/data/site";
import { publicConfigQuery } from "#/features/config/config.queries";
import { openChat } from "#/lib/chat-widget";
import { formatPriceCompact } from "#/lib/price";
import { cn } from "#/lib/utils";
import { Container } from "./container";

function Item({
	icon,
	className,
	children,
}: {
	icon: IconSvgElement;
	className?: string;
	children: ReactNode;
}) {
	return (
		<p className={cn("flex items-center gap-2", className)}>
			<HugeiconsIcon icon={icon} size={14} className="shrink-0" />
			<span>{children}</span>
		</p>
	);
}

/** Three facts that answer a shopper's first questions: freshness, help, delivery. */
export function AnnouncementBar() {
	const { data: config } = useSuspenseQuery(publicConfigQuery);

	return (
		<section
			aria-label="Announcements"
			className="bg-neutral-900 text-white/80 text-xs"
		>
			<Container className="flex h-8 items-center justify-center gap-6 md:justify-between">
				<Item icon={Clock01Icon}>
					Prices refreshed every morning at {site.priceCheckTime}
				</Item>

				{config.chatEmbedUrl && (
					<Item icon={Message01Icon} className="hidden sm:flex">
						Questions about sizes?{" "}
						<button
							type="button"
							onClick={openChat}
							className="font-semibold text-white underline underline-offset-4"
						>
							Chat with us
						</button>
					</Item>
				)}

				<Item icon={DeliveryTruck01Icon} className="hidden md:flex">
					Free delivery in {site.delivery.region} over{" "}
					{formatPriceCompact(site.delivery.freeFrom)}
				</Item>
			</Container>
		</section>
	);
}
