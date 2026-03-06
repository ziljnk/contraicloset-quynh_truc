"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookmarkIcon, type BookmarkIconHandle } from "@/components/animated-icons/bookmark";
import { useIconAnimation } from "@/hooks/use-icon-animation";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";
import { getPrimaryOutfitImageSources, getResponsiveImageUrl } from "@/utils/image-variants";

export function SimilarOutfitCard({ outfit }: { outfit: any }) {
	const { user } = useAuth();
	const icon = useIconAnimation<BookmarkIconHandle>();
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const isMobile = useMediaQuery({ maxWidth: 768 });
	const imageSource = getPrimaryOutfitImageSources(outfit);

	useEffect(() => {
		if (user && outfit?.saved_by) {
			setIsSaved(outfit.saved_by.includes(user.uid));
		}
	}, [user, outfit]);

	const handleToggleSave = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!user) {
			toast.error("Please login to bookmark outfits");
			return;
		}

		if (isSaving) return;

		setIsSaving(true);
		
		// Optimistic update
		const newSavedState = !isSaved;
		setIsSaved(newSavedState);

		// Trigger animation based on state
		if (newSavedState) {
			icon.events.onMouseEnter();
		} else {
			icon.events.onMouseLeave();
		}

		try {
			const collectionName = process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME || "outfits";
			const outfitRef = doc(db, collectionName, outfit.id);

			if (newSavedState) {
				await updateDoc(outfitRef, {
					saved_by: arrayUnion(user.uid)
				});
				toast.success("Saved to bookmarks");
			} else {
				await updateDoc(outfitRef, {
					saved_by: arrayRemove(user.uid)
				});
				toast.success("Removed from bookmarks");
			}
		} catch (error) {
			console.error("Error toggling save:", error);
			// Revert on error
			setIsSaved(!newSavedState);
			toast.error("Failed to update bookmark");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="group relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100">
			<Link
				href={`/outfit/${(outfit.title || outfit.id).replace(/^#/, '')}`}
				className="block w-full h-full"
			>
				<Image
					src={getResponsiveImageUrl(imageSource, isMobile)}
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
				className={cn(
					"absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300",
					isSaved 
						? "bg-black/40 text-white opacity-100" 
						: "bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100"
				)}
				onClick={handleToggleSave}
				onMouseEnter={() => !isSaved && icon.events.onMouseEnter()}
				onMouseLeave={() => !isSaved && icon.events.onMouseLeave()}
			>
				<BookmarkIcon 
					ref={icon.ref} 
					size={20} 
					className={cn(isSaved && "[&_svg]:fill-current")}
				/>
			</button>
		</div>
	);
}

