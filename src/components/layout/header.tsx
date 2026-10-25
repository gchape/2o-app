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
import { useTranslation } from "#/i18n/translate";
import { AccountLink } from "./account-link";
import { Container } from "./container";
import { LanguageSelector } from "./language-selector";
import { Logo } from "./logo";

function DesktopNav() {
	const t = useTranslation();
	return (
		<NavigationMenu className="hidden md:flex">
			<NavigationMenuList>
				{departmentSlugs.map((slug) => (
					<NavigationMenuItem key={slug}>
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							render={
								<Link
									to="/$department/{-$category}"
									params={{ department: slug, category: undefined }}
								>
									{t(departments[slug].label)}
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
	const t = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className="md:hidden"
						aria-label={t("Open menu")}
					/>
				}
			>
				<HugeiconsIcon icon={MenuCircleIcon} size={20} />
			</SheetTrigger>
			<SheetContent side="left">
				<SheetHeader>
					<SheetTitle>{t("Menu")}</SheetTitle>
				</SheetHeader>
				<nav className="flex flex-col gap-2 px-5 py-4">
					{departmentSlugs.map((slug) => (
						<Link
							key={slug}
							to="/$department/{-$category}"
							params={{ department: slug, category: undefined }}
							onClick={() => setOpen(false)}
							className="rounded-lg px-4 py-4 text-lg font-medium tracking-tight hover:bg-accent"
						>
							{t(departments[slug].label)}
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
			<Container className="flex h-18 items-center justify-between gap-2 sm:gap-4 md:h-22">
				<div className="flex items-center gap-8 lg:gap-12">
					<Logo className="h-9 md:h-10" />
					<DesktopNav />
				</div>

				<div className="flex items-center gap-1 sm:gap-2">
					<AccountLink />
					<CartButton />
					<MobileMenu />
					<LanguageSelector />
				</div>
			</Container>
		</header>
	);
}
