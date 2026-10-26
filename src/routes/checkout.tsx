import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { site } from "#/data/site";
import { checkoutPageFn } from "#/features/checkout/checkout.functions";
import { CheckoutPage } from "#/features/checkout/components/checkout-page";
import { translate as t } from "#/i18n/translate";

export const Route = createFileRoute("/checkout")({
	validateSearch: z.object({ checkout: z.uuid().optional().catch(undefined) }),
	loaderDeps: ({ search }) => ({ id: search.checkout }),
	loader: ({ deps }) => checkoutPageFn({ data: deps }),
	staleTime: 0,
	head: ({ match }) => ({
		meta: [
			{ title: `${t("Checkout", {}, match.context.locale)} | ${site.name}` },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: () => <CheckoutPage data={Route.useLoaderData()} />,
});
