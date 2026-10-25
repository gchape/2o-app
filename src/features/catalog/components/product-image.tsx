import { Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "#/i18n/translate";
import { cn } from "#/lib/utils";

type ProductImageProps = {
	src: string | null;
	alt: string;
	/** Pass `"lazy"` for images that are usually below the fold. */
	loading?: "lazy" | "eager";
	fetchPriority?: ComponentProps<"img">["fetchPriority"];
} & Omit<ComponentProps<"div">, "children">;

/** Image on a muted placeholder, so a missing photo still reserves its space. */
export function ProductImage({
	src,
	alt,
	loading,
	fetchPriority,
	className,
	...props
}: ProductImageProps) {
	const t = useTranslation();
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const available = src && src !== failedSrc;
	return (
		<div
			className={cn("relative overflow-hidden bg-muted", className)}
			{...props}
		>
			{available ? (
				<img
					src={src}
					alt={alt}
					loading={loading}
					decoding="async"
					fetchPriority={fetchPriority}
					onError={() => setFailedSrc(src)}
					className="size-full object-cover"
				/>
			) : (
				<div
					role="img"
					aria-label={
						alt ? `${alt}: ${t("Image unavailable")}` : t("Image unavailable")
					}
					aria-hidden={alt ? undefined : true}
					className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground"
				>
					<HugeiconsIcon icon={Image01Icon} size={28} aria-hidden="true" />
					<span className="text-xs">{t("Image unavailable")}</span>
				</div>
			)}
		</div>
	);
}
