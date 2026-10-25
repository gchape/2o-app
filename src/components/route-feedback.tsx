import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";
import { useTranslation } from "#/i18n/translate";

export function PageError() {
	const t = useTranslation();
	const router = useRouter();
	const { reset } = useQueryErrorResetBoundary();

	useEffect(() => reset(), [reset]);

	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-title text-3xl">{t("Couldn't load this page")}</h1>
			<p className="text-muted-foreground">
				{t("Please try again in a moment.")}
			</p>
			<Button onClick={() => router.invalidate()}>{t("Try again")}</Button>
		</Container>
	);
}

export function PageNotFound() {
	const t = useTranslation();
	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-title text-3xl">{t("Page not found")}</h1>
			<p className="text-muted-foreground">
				{t("This page may have moved or is no longer available.")}
			</p>
			<LinkButton to="/">{t("Keep shopping")}</LinkButton>
		</Container>
	);
}

export function PagePending() {
	const t = useTranslation();
	return (
		<Container className="py-20 text-center">
			<p role="status" className="text-muted-foreground">
				{t("Loading…")}
			</p>
		</Container>
	);
}
