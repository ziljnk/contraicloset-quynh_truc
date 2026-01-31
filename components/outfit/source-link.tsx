"use client";

import { useIconAnimation } from "@/hooks/use-icon-animation";
import { LinkIcon, type LinkIconHandle } from "@/components/animated-icons/link";

export function SourceLink({ url }: { url: string }) {
	const icon = useIconAnimation<LinkIconHandle>();

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary px-4 py-2 rounded-full"
			{...icon.events}
		>
			<LinkIcon ref={icon.ref} size={16} className="mr-2" />
			Nguồn
		</a>
	);
}
