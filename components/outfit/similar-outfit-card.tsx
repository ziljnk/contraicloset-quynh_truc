import Link from "next/link";
import Image from "next/image";
import { BookmarkIcon, type BookmarkIconHandle } from "@/components/animated-icons/bookmark";
import { useIconAnimation } from "@/hooks/use-icon-animation";

export function SimilarOutfitCard({ outfit }: { outfit: any }) {
	const icon = useIconAnimation<BookmarkIconHandle>();

	return (
		<div className="group relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100">
			<Link
				href={`/outfit/${outfit.id}`}
				className="block w-full h-full"
			>
				<Image
					src={
						outfit.images?.[0] || "https://placehold.co/600x900"
					}
					alt={outfit.title || "Outfit"}
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					className="object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<p className="text-white font-medium truncate">
						{outfit.title || "Untitled"}
					</p>
				</div>
			</Link>
			<button
				type="button"
				className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					icon.events.onMouseEnter(); // Trigger animation on click as well? Or just leave it.
				}}
				{...icon.events}
			>
				<BookmarkIcon ref={icon.ref} size={20} />
			</button>
		</div>
	);
}

