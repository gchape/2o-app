import { debounce } from "es-toolkit";
import { useEffect, useMemo, useRef } from "react";

/**
 * A stable debounced function that always calls the latest `fn`, and drops a
 * pending call on unmount. `.flush()` runs a pending call now (on Enter).
 */
export function useDebouncedCallback<A extends unknown[]>(
	fn: (...args: A) => void,
	wait: number,
) {
	const latest = useRef(fn);
	useEffect(() => {
		latest.current = fn;
	});

	const debounced = useMemo(
		() => debounce((...args: A) => latest.current(...args), wait),
		[wait],
	);
	useEffect(() => () => debounced.cancel(), [debounced]);

	return debounced;
}
