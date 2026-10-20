import { HugeiconsIcon } from "@hugeicons/react";
import { messages } from "#/lib/site";

const track = [...messages, ...messages].map((message, i) => ({
	...message,
	id: String(i),
}));

const halves = ["a", "b"];

export function AnnouncementBar() {
	return (
		<section
			aria-label="Announcements"
			className="overflow-hidden bg-brand py-2.5 font-bold text-brand-foreground text-xs uppercase tracking-wider"
		>
			<p className="sr-only">{messages.map((m) => m.text).join(". ")}</p>
			<div className="mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
				<div
					aria-hidden
					className="flex w-max animate-marquee hover:paused motion-reduce:animate-none"
				>
					{halves.map((half) => (
						<ul key={half} className="flex shrink-0 items-center">
							{track.map((item) => (
								<li
									key={item.id}
									className="flex items-center whitespace-nowrap"
								>
									<span className="flex items-center gap-2 px-8">
										<HugeiconsIcon
											icon={item.icon}
											size={16}
											strokeWidth={2.5}
											className="shrink-0"
										/>
										{item.text}
									</span>
									<span className="size-1.5 rotate-45 bg-brand-foreground/60" />
								</li>
							))}
						</ul>
					))}
				</div>
			</div>
		</section>
	);
}
