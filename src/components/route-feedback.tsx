import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Container } from "#/components/layout/container";
import { LinkButton } from "#/components/link-button";
import { Button } from "#/components/ui/button";

export function PageError() {
	const router = useRouter();
	const { reset } = useQueryErrorResetBoundary();

	useEffect(() => reset(), [reset]);

	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-display text-3xl">Couldn't load this page</h1>
			<p className="text-muted-foreground">Please try again in a moment.</p>
			<Button onClick={() => router.invalidate()}>Try again</Button>
		</Container>
	);
}

export function PageNotFound() {
	return (
		<Container className="flex flex-col items-center gap-4 py-20 text-center">
			<h1 className="type-display text-3xl">Page not found</h1>
			<p className="text-muted-foreground">
				This page may have moved or is no longer available.
			</p>
			<LinkButton to="/">Keep shopping</LinkButton>
		</Container>
	);
}

export function PagePending() {
	return (
		<Container className="py-20 text-center">
			<p role="status" className="text-muted-foreground">
				Loading…
			</p>
		</Container>
	);
}
