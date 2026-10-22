import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "#/components/ui/carousel";
import { slides } from "#/data/slides";
import { cn } from "#/lib/utils";

const tones = {
	brand: {
		slide: "bg-brand text-brand-foreground",
		button:
			"bg-neutral-950 text-white hover:bg-neutral-800 [a]:hover:bg-neutral-800",
	},
	dark: {
		slide: "bg-neutral-950 text-white",
		button: "",
	},
};

export function PromoCarousel() {
	const autoplay = useRef(Autoplay({ delay: 5_000, stopOnInteraction: false }));
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		if (!api) return;
		const onSelect = () => setCurrent(api.selectedScrollSnap());
		onSelect();
		api.on("select", onSelect);
		return () => {
			api.off("select", onSelect);
		};
	}, [api]);

	return (
		<section className="mx-auto max-w-6xl px-4 py-12">
			<Carousel
				setApi={setApi}
				opts={{ loop: true }}
				plugins={[autoplay.current]}
				onMouseEnter={autoplay.current.stop}
				onMouseLeave={autoplay.current.reset}
			>
				<CarouselContent>
					{slides.map((s) => (
						<CarouselItem key={s.title}>
							<div
								className={cn(
									"flex min-h-64 flex-col items-start justify-center gap-4 rounded-2xl p-8 md:min-h-80 md:p-14",
									tones[s.tone].slide,
								)}
							>
								<h2 className="max-w-xl font-extrabold text-3xl tracking-tight md:text-5xl">
									{s.title}
								</h2>
								<p className="max-w-md opacity-80 md:text-lg">{s.text}</p>
								<Button
									size="lg"
									nativeButton={false}
									className={cn("mt-2", tones[s.tone].button)}
									render={
										<Link
											to="/$department/$category"
											params={{
												department: s.department,
												category: s.category,
											}}
										>
											{s.cta}
										</Link>
									}
								/>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="left-3 hidden md:inline-flex" />
				<CarouselNext className="right-3 hidden md:inline-flex" />
			</Carousel>

			<div className="mt-4 flex justify-center gap-2">
				{slides.map((s, i) => (
					<button
						key={s.title}
						type="button"
						aria-label={`Go to slide ${i + 1}`}
						onClick={() => api?.scrollTo(i)}
						className={cn(
							"h-2 rounded-full transition-all",
							i === current ? "w-6 bg-neutral-950" : "w-2 bg-neutral-300",
						)}
					/>
				))}
			</div>
		</section>
	);
}
