/** Rows to skip so a 1-based `page` starts in the right place. */
export const pageOffset = (page: number, pageSize: number) =>
	(page - 1) * pageSize;

/** `getNextPageParam` for 1-based page infinite queries. */
export const nextPageParam = (
	last: { hasMore: boolean },
	_pages: unknown,
	lastPageParam: number,
) => (last.hasMore ? lastPageParam + 1 : undefined);
