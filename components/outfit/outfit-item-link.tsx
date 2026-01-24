"use client";

import { Tag } from "lucide-react";
import { ArrowRightIcon, type ArrowRightIconHandle } from "@/components/animated-icons/arrow-right";
import { useIconAnimation } from "@/hooks/use-icon-animation";
import { type LinkIconHandle } from "@/components/animated-icons/link";

export function OutfitItemLink({ item }: { item: any }) {
	const arrowIcon = useIconAnimation<ArrowRightIconHandle>();
	const linkIcon = useIconAnimation<LinkIconHandle>();

	return (
		<a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
			onMouseEnter={() => {
				arrowIcon.events.onMouseEnter();
				linkIcon.events.onMouseEnter();
			}}
			onMouseLeave={() => {
				arrowIcon.events.onMouseLeave();
				linkIcon.events.onMouseLeave();
			}}
		>
			<div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mr-4 transition-transform">
				<Tag className="w-6 h-6" />
			</div>
			<div className="flex-1">
				<p className="font-bold text-base">{item.label}</p>
				{item.type && (
					<p className="text-sm text-muted-foreground capitalize">
						{item.type}
					</p>
				)}
			</div>
			<div className="text-muted-foreground group-hover:text-primary">
				<ArrowRightIcon ref={arrowIcon.ref} />
			</div>
		</a>
	);
}
