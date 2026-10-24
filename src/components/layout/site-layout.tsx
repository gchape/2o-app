import type { ReactNode } from "react";
import { CartDrawer } from "#/features/cart/components/cart-drawer";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { Header } from "./header";

/** The chrome shared by every page. */
export function SiteLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<div className="flex min-h-dvh flex-col">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md"
				>
					Skip to content
				</a>
				<AnnouncementBar />
				<Header />
				<main id="main-content" tabIndex={-1} className="flex-1">
					{children}
				</main>
				<Footer />
			</div>
			<CartDrawer />
		</>
	);
}
