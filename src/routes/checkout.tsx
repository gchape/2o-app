import { createFileRoute } from "@tanstack/react-router";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { site } from "#/data/site";
import { translate as t, useTranslation } from "#/i18n/translate";

// Placeholder until checkout exists; keep it out of search results meanwhile.
export const Route = createFileRoute("/checkout")({
	head: ({ match }) => ({
		meta: [
			{ title: `${t("Checkout", {}, match.context.locale)} | ${site.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: CheckoutComingSoon,
});

function CheckoutComingSoon() {
	const t = useTranslation();
	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-title text-3xl md:text-4xl">
				{t("Checkout is coming soon")}
			</h1>
			<p className="max-w-md text-muted-foreground">
				{t(
					"We're still setting up ordering. Your cart is saved, so you can keep shopping and come back.",
				)}
			</p>
			<LinkButton to="/" size="lg">
				{t("Keep shopping")}
			</LinkButton>
		</Container>
	);
}
