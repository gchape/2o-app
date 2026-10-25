import { createFileRoute } from "@tanstack/react-router";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";

// Placeholder until checkout exists; keep it out of search results meanwhile.
export const Route = createFileRoute("/checkout")({
	head: () => ({
		meta: [
			{ title: `Checkout | ${site.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: CheckoutComingSoon,
});

function CheckoutComingSoon() {
	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-display text-3xl md:text-4xl">
				Checkout is coming soon
			</h1>
			<p className="max-w-md text-muted-foreground">
				We're still setting up ordering. Your cart is saved, so you can keep
				shopping and come back.
			</p>
			<LinkButton to="/" size="lg">
				Keep shopping
			</LinkButton>
		</Container>
	);
}
