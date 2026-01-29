"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "../animated-icons/home";
import { SearchIcon } from "../animated-icons/search";
import { BookmarkIcon } from "../animated-icons/bookmark";
import { useIconAnimation, AnimatedIconHandle } from "@/hooks/use-icon-animation";
import { cn } from "@/lib/utils";

interface NavItemProps {
	href: string;
	icon: React.ElementType;
	label: string;
}

const NavItem = ({ href, icon: Icon, label }: NavItemProps) => {
	const pathname = usePathname();
	const { ref, events } = useIconAnimation<AnimatedIconHandle>();

	// Exact match for home, startsWith for others to handle sub-pages
	const isActive = href === "/"
		? pathname === "/"
		: pathname.startsWith(href);

	return (
		<Link
			href={href}
			{...events}
			className={cn(
				"flex flex-col items-center justify-center gap-1 rounded-xl px-5 py-2 transition-colors",
				isActive
					? "bg-[#efe6d5] text-[#3e3226]"
					: "text-neutral-400 hover:bg-[#efe6d5]/50 hover:text-[#3e3226]"
			)}
		>
			<Icon ref={ref} />
			<span className="text-[10px] font-medium">{label}</span>
		</Link>
	);
};

export default function BottomNav() {
	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md">
			<nav className="flex h-20 items-center justify-center gap-15 md:gap-30 px-4 pb-2">
				<NavItem href="/" icon={HomeIcon} label="Home" />
				<NavItem href="/search" icon={SearchIcon} label="Search" />
				<NavItem href="/bookmark" icon={BookmarkIcon} label="Bookmark" />
			</nav>
		</div>
	);
}
