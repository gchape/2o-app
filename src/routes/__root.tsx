import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AnnouncementBar } from "#/components/announcement-bar";
import { CartDrawer } from "#/components/cart/cart-drawer";
import { Footer } from "#/components/footer";
import { Header } from "#/components/header";
import { CartProvider } from "#/lib/cart";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "2o | Big brands. Small prices." },
			{
				name: "description",
				content:
					"Daily deals on shoes and clothing for men, women and kids, checked across wholesale stores.",
			},
		],
		links: [
			{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
			{ rel: "apple-touch-icon", href: "/apple-icon-180x180.png" },
			{ rel: "stylesheet", href: appCss },
		],
		scripts: [
			{
				children: `
				var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
				(function(){
					var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
					s1.async=true;
					s1.src='https://embed.tawk.to/6ad5e6b5611f3d34c113d575/1k59oqdbn';
					s1.charset='UTF-8';
					s1.setAttribute('crossorigin','*');
					s0.parentNode.insertBefore(s1,s0);
				})();
			`,
			},
		],
	}),
	shellComponent: ({ children }) => (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<CartProvider>
					<div className="flex min-h-screen flex-col">
						<AnnouncementBar />
						<Header />
						<div className="flex-1">{children}</div>
						<Footer />
					</div>
					<CartDrawer />
				</CartProvider>
				<TanStackDevtools
					config={{
						position: "bottom-left",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	),
});
