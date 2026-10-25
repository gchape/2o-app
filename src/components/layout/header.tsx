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
import {
	categories,
	categorySlugs,
	departmentSlugs,
	departments,
} from "#/data/catalog";
import { CartButton } from "#/features/cart/components/cart-button";
import { useTranslation } from "#/i18n/translate";
import { AccountLink } from "./account-link";
import { Container } from "./container";
import { LanguageSelector } from "./language-selector";
import { Logo } from "./logo";

function DesktopNav() {
	const t = useTranslation();
	return (
		<NavigationMenu aria-label={t("Shop")} className="hidden lg:flex">
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink
						className={navigationMenuTriggerStyle()}
						render={
							<Link
								to="/deals"
								activeOptions={{ includeSearch: false }}
								activeProps={{ className: "bg-accent text-brand" }}
							>
								{t("Deals")}
							</Link>
						}
					/>
				</NavigationMenuItem>
				{departmentSlugs.map((slug) => (
					<NavigationMenuItem key={slug}>
						<NavigationMenuLink
							className={navigationMenuTriggerStyle()}
							render={
								<Link
									to="/$department/{-$category}"
									params={{ department: slug, category: undefined }}
									activeOptions={{ includeSearch: false }}
									activeProps={{ className: "bg-accent text-brand" }}
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
						className="lg:hidden"
						aria-label={t("Open menu")}
					/>
				}
			>
				<HugeiconsIcon icon={MenuCircleIcon} size={20} />
			</SheetTrigger>
			<SheetContent side="left" className="overflow-y-auto overscroll-contain">
				<SheetHeader>
					<SheetTitle>{t("Menu")}</SheetTitle>
				</SheetHeader>
				<nav aria-label={t("Shop")} className="flex flex-col gap-2 px-5 pb-8">
					<Link
						to="/deals"
						onClick={() => setOpen(false)}
						activeOptions={{ includeSearch: false }}
						activeProps={{ className: "bg-muted underline underline-offset-4" }}
						className="rounded-lg px-4 py-4 font-semibold hover:bg-accent"
					>
						{t("All deals")}
					</Link>
					{departmentSlugs.map((slug) => (
						<div key={slug} className="border-t pt-2">
							<Link
								to="/$department/{-$category}"
								params={{ department: slug, category: undefined }}
								onClick={() => setOpen(false)}
								activeOptions={{ exact: true, includeSearch: false }}
								activeProps={{
									className: "bg-muted underline underline-offset-4",
								}}
								className="block rounded-lg px-4 py-3 font-semibold hover:bg-accent"
							>
								{t(departments[slug].label)}
							</Link>
							<div className="flex flex-wrap gap-1 px-2">
								{categorySlugs.map((category) => (
									<Link
										key={category}
										to="/$department/{-$category}"
										params={{ department: slug, category }}
										onClick={() => setOpen(false)}
										activeOptions={{ includeSearch: false }}
										activeProps={{
											className:
												"bg-muted text-foreground underline underline-offset-4",
										}}
										className="rounded-lg px-3 py-3 text-muted-foreground hover:bg-accent hover:text-foreground"
									>
										{t(categories[category].label)}
									</Link>
								))}
							</div>
						</div>
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
				<div className="flex min-w-0 items-center gap-8">
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
