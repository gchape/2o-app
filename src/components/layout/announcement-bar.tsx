import {
	Clock01Icon,
	DeliveryTruck01Icon,
	Message01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { site } from "#/data/site";
import { publicConfigQuery } from "#/features/config/config.queries";
import { useTranslation } from "#/i18n/translate";
import { openChat } from "#/lib/chat-widget";
import { usePriceFormatter } from "#/lib/price";
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
	const { formatPriceCompact } = usePriceFormatter();
	const t = useTranslation();
	const { data: config } = useSuspenseQuery(publicConfigQuery);

	return (
		<section
			aria-label={t("Announcements")}
			className="border-b bg-neutral-100 text-neutral-600 type-caption"
		>
			<Container className="flex min-h-8 items-center justify-center gap-6 py-1 md:justify-between">
				<Item icon={Clock01Icon}>
					{t("Prices refreshed every morning at {{time}}", {
						time: site.priceCheckTime,
					})}
				</Item>

				{config.chatEmbedUrl && (
					<Item icon={Message01Icon} className="hidden sm:flex">
						{t("Questions about sizes?")}{" "}
						<Button
							variant="link"
							size="xs"
							type="button"
							onClick={openChat}
							className="h-auto p-0 font-semibold text-neutral-800 underline"
						>
							{t("Chat with us")}
						</Button>
					</Item>
				)}

				<Item icon={DeliveryTruck01Icon} className="hidden md:flex">
					{t("Free delivery in Georgia over {{price}}", {
						price: formatPriceCompact(site.delivery.freeFrom),
					})}
				</Item>
			</Container>
		</section>
	);
}
