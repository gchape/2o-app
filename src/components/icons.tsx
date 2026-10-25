import {
	Alert02Icon,
	ArrowDown01Icon,
	Calendar03Icon,
	Cancel01Icon,
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	ComputerIcon,
	Copy01Icon,
	Delete02Icon,
	Link01Icon,
	Login01Icon,
	Logout01Icon,
	PlugSocketIcon,
	Settings01Icon,
	Shield01Icon,
	SmartPhone01Icon,
	Tick02Icon,
	UnfoldMoreIcon,
	Unlink01Icon,
	Upload01Icon,
	UserAdd01Icon,
	UserIcon,
	ViewIcon,
	ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ComponentProps } from "react";

type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon">;

const createIcon = (icon: IconSvgElement) =>
	// biome-ignore lint/correctness/noComponentHookFactories: runs once per icon at module load, never during render.
	function Icon(props: IconProps) {
		return <HugeiconsIcon icon={icon} strokeWidth={2} {...props} />;
	};

/**
 * Hugeicons under the names the generated Better Auth UI components expect.
 * Those components were written against lucide-react; mapping the names here
 * keeps them untouched (so upstream updates still diff cleanly) while
 * Hugeicons stays the only icon library in the bundle.
 */
export const CalendarIcon = createIcon(Calendar03Icon);
export const Check = createIcon(Tick02Icon);
export const ChevronDownIcon = createIcon(ArrowDown01Icon);
export const ChevronsUpDown = createIcon(UnfoldMoreIcon);
export const CircleCheckIcon = createIcon(CheckmarkCircle02Icon);
export const CircleXIcon = createIcon(CancelCircleIcon);
export const Copy = createIcon(Copy01Icon);
export const Eye = createIcon(ViewIcon);
export const EyeOff = createIcon(ViewOffIcon);
export const Link2 = createIcon(Link01Icon);
export const Link2Off = createIcon(Unlink01Icon);
export const LogIn = createIcon(Login01Icon);
export const LogOut = createIcon(Logout01Icon);
export const Monitor = createIcon(ComputerIcon);
export const Plug = createIcon(PlugSocketIcon);
export const Settings = createIcon(Settings01Icon);
export const Shield = createIcon(Shield01Icon);
export const Smartphone = createIcon(SmartPhone01Icon);
export const Trash2 = createIcon(Delete02Icon);
export const TriangleAlertIcon = createIcon(Alert02Icon);
export const Upload = createIcon(Upload01Icon);
export const User2 = createIcon(UserIcon);
export const UserPlus2 = createIcon(UserAdd01Icon);
export const X = createIcon(Cancel01Icon);
