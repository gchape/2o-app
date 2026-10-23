import { type RefObject, useEffect, useState } from "react";

/** Whether the scroller can still move left / right, kept in sync with its scroll. */
export function useScrollEdges(ref: RefObject<HTMLElement | null>) {
	const [edges, setEdges] = useState({ atStart: true, atEnd: false });

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const update = () =>
			setEdges({
				atStart: el.scrollLeft <= 1,
				atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
			});

		update();
		el.addEventListener("scroll", update, { passive: true });
		const observer = new ResizeObserver(update);
		observer.observe(el);

		return () => {
			el.removeEventListener("scroll", update);
			observer.disconnect();
		};
	}, [ref]);

	return edges;
}
