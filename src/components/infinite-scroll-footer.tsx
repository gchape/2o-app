import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Button } from "#/components/ui/button";

type InfiniteScrollFooterProps = {
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	/** Whether the last attempt to load another page failed. */
	isError: boolean;
	fetchNextPage: () => unknown;
};

/**
 * Sits under an infinite list: loads the next page as it nears the viewport,
 * and swaps to a retry button if that load fails (so a failure can't loop).
 */
export function InfiniteScrollFooter({
	hasNextPage,
	isFetchingNextPage,
	isError,
	fetchNextPage,
}: InfiniteScrollFooterProps) {
	const { ref, inView } = useInView({ rootMargin: "600px" });

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage && !isError) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

	if (!hasNextPage && !isError) return null;

	return (
		<div ref={ref} className="mt-10 flex justify-center">
			<Button
				variant="outline"
				size="lg"
				disabled={isFetchingNextPage}
				onClick={() => fetchNextPage()}
			>
				{isFetchingNextPage
					? "Loading more…"
					: isError
						? "Couldn't load more. Try again"
						: "Load more"}
			</Button>
			<span role="status" className="sr-only">
				{isFetchingNextPage ? "Loading more results" : ""}
			</span>
		</div>
	);
}
