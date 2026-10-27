import { useTranslation } from "#/i18n/translate";
import { storeCode } from "./store";

export function StoreLabel({ storeId }: { storeId: string }) {
	const t = useTranslation();
	return <span>{t("Store {{code}}", { code: storeCode(storeId) })}</span>;
}
