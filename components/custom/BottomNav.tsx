import Link from "next/link";
import { HomeIcon } from "../animated-icons/home";
import { SearchIcon } from "../animated-icons/search";
import { BookmarkIcon } from "../animated-icons/bookmark";

export default function BottomNav() {
	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md">
			<nav className="flex h-16 items-center justify-center gap-30 px-4">
				<Link
					href="/"
					className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
				>
					<HomeIcon />
					<span className="text-[10px] font-medium">Home</span>
				</Link>
				<Link
					href="/search"
					className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
				>
					<SearchIcon />
					<span className="text-[10px] font-medium">Search</span>
				</Link>
				<Link
					href="/bookmark"
					className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
				>
					<BookmarkIcon />
					<span className="text-[10px] font-medium">Bookmark</span>
				</Link>
			</nav>
		</div>
	);
}
