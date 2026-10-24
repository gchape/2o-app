import { createLink } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

type ButtonAnchorProps = ComponentProps<"a"> &
	VariantProps<typeof buttonVariants>;

function ButtonAnchor({
	variant,
	size,
	className,
	...props
}: ButtonAnchorProps) {
	return (
		<a
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

/**
 * A router `Link` that looks like a `Button`, fully type-checked
 * (`to`, `params`, `search`) and rendered as a real anchor.
 *
 * @example
 * <LinkButton to="/$department/{-$category}" params={{ department: "women", category: undefined }} size="lg">Shop</LinkButton>
 */
export const LinkButton = createLink(ButtonAnchor);
