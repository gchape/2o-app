import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

type ProductImageProps = {
	src: string | null;
	alt: string;
	/** Pass `"lazy"` for images that are usually below the fold. */
	loading?: "lazy" | "eager";
} & Omit<ComponentProps<"div">, "children">;

/** Image on a muted placeholder, so a missing photo still reserves its space. */
export function ProductImage({
	src,
	alt,
	loading,
	className,
	...props
}: ProductImageProps) {
	return (
		<div className={cn("overflow-hidden bg-muted", className)} {...props}>
			{src && (
				<img
					src={src}
					alt={alt}
					loading={loading}
					className="size-full object-cover"
				/>
			)}
		</div>
	);
}
