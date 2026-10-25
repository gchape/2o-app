import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { useLocale } from "#/i18n/locale";
import { setLocaleFn } from "#/i18n/locale.functions";
import { useTranslation } from "#/i18n/translate";

export function LanguageSelector() {
	const locale = useLocale();
	const t = useTranslation();
	const router = useRouter();
	const saveLocale = useServerFn(setLocaleFn);
	const [pending, setPending] = useState(false);

	return (
		<Select
			value={locale}
			disabled={pending}
			onValueChange={async (value) => {
				if ((value !== "ka" && value !== "en") || value === locale) return;
				setPending(true);
				try {
					await saveLocale({ data: value });
					await router.invalidate({ sync: true });
				} catch {
					toast.error(t("Couldn't change the language. Please try again."));
				} finally {
					setPending(false);
				}
			}}
		>
			<SelectTrigger
				aria-label={`${t("Language")}: ${locale === "ka" ? "ქართული" : "English"}`}
				aria-busy={pending}
				className="h-10 w-16 gap-1 px-2"
			>
				<SelectValue>
					<span aria-hidden="true" className="text-xl leading-none">
						{locale === "ka" ? "🇬🇪" : "🇬🇧"}
					</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent align="end" alignItemWithTrigger={false}>
				<SelectItem value="ka">
					<span aria-hidden="true">🇬🇪</span>
					<span lang="ka">ქართული</span>
				</SelectItem>
				<SelectItem value="en">
					<span aria-hidden="true">🇬🇧</span>
					<span lang="en">English</span>
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
