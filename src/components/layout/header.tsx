import { MenuCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CartButton } from "#/components/cart/cart-button";
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
import { departmentSlugs } from "#/data/departments";
import { UserButton } from "../auth/user/user-button";

export function Header() {
	const [open, setOpen] = useState(false);

	return (
		<header className="dark border-b bg-background text-foreground">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<Link to="/" aria-label="2o home" className="block">
					<img src="/images/logo.webp" alt="2o" className="h-9 w-auto" />
				</Link>

				<div className="flex items-center gap-2">
					{/* Desktop navigation */}
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList className="capitalize">
							{departmentSlugs.map((slug) => (
								<NavigationMenuItem key={slug}>
									<NavigationMenuLink
										className={navigationMenuTriggerStyle()}
										render={
											<Link to="/$department" params={{ department: slug }}>
												{slug}
											</Link>
										}
									/>
								</NavigationMenuItem>
							))}
						</NavigationMenuList>
					</NavigationMenu>

					<UserButton />
					<CartButton />

					{/* Mobile menu */}
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
							<nav className="flex flex-col gap-1 px-4 capitalize">
								{departmentSlugs.map((slug) => (
									<Link
										key={slug}
										to="/$department"
										params={{ department: slug }}
										onClick={() => setOpen(false)}
										className="rounded-md px-3 py-2 text-base hover:bg-accent"
									>
										{slug}
									</Link>
								))}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
