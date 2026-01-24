import Link from "next/link";
import Image from "next/image";

export function SimilarOutfitCard({ outfit }: { outfit: any }) {
	return (
		<Link
			href={`/outfit/${outfit.id}`}
			className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 block"
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
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<p className="text-white font-medium truncate">
					{outfit.title || "Untitled"}
				</p>
			</div>
		</Link>
	);
}
