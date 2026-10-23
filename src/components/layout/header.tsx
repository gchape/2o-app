import { MenuCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { departmentSlugs, departments } from "#/data/catalog";
import { CartButton } from "#/features/cart/components/cart-button";
import { AccountLink } from "./account-link";
import { Container } from "./container";
import { Logo } from "./logo";

function DesktopNav() {
	return (
		<NavigationMenu className="hidden md:flex">
			<NavigationMenuList>
				{departmentSlugs.map((slug) => (
					<NavigationMenuItem key={slug}>
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							render={
								<Link to="/$department" params={{ department: slug }}>
									{departments[slug].label}
								</Link>
							}
						/>
					</NavigationMenuItem>
				))}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function MobileMenu() {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className="md:hidden"
						aria-label="Open menu"
					/>
				}
			>
				<HugeiconsIcon icon={MenuCircleIcon} size={20} />
			</SheetTrigger>
			<SheetContent side="left">
				<SheetHeader>
					<SheetTitle>Menu</SheetTitle>
				</SheetHeader>
				<nav className="flex flex-col gap-1 px-4">
					{departmentSlugs.map((slug) => (
						<Link
							key={slug}
							to="/$department"
							params={{ department: slug }}
							onClick={() => setOpen(false)}
							className="rounded-md px-3 py-2 text-base hover:bg-accent"
						>
							{departments[slug].label}
						</Link>
					))}
				</nav>
			</SheetContent>
		</Sheet>
	);
}

export function Header() {
	return (
		<header className="dark border-b bg-background text-foreground">
			<Container className="flex h-16 items-center justify-between gap-4">
				<div className="flex items-center gap-6">
					<Logo className="h-9" />
					<DesktopNav />
				</div>

				<div className="flex items-center gap-2">
					<AccountLink />
					<CartButton />
					<MobileMenu />
				</div>
			</Container>
		</header>
	);
}
