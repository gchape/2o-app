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
				<AnnouncementBar />
				<Header />
				<main className="flex-1">{children}</main>
				<Footer />
			</div>
			<CartDrawer />
		</>
	);
}
