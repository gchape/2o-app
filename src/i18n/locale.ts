import { enUS, ka } from "date-fns/locale";
import { createContext, useContext } from "react";

export type Locale = "ka" | "en";
export const DEFAULT_LOCALE: Locale = "ka";
export const languageTags = { ka: "ka-GE", en: "en-US" } as const;
export const dateLocales = { ka, en: enUS };
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);
export const LocaleProvider = LocaleContext.Provider;
export const useLocale = () => useContext(LocaleContext);
