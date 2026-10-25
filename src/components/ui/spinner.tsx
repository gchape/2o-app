import { useTranslation } from "#/i18n/translate";
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps } from "react"
import { cn } from "#/lib/utils"

function Spinner({
  className,
  ...props
}: Omit<ComponentProps<typeof HugeiconsIcon>, "icon">) {
	const t = useTranslation();
  return (
    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} data-slot="spinner" role="status" aria-label={t("Loading")} className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
