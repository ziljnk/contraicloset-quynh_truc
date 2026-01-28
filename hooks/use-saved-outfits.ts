import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useAuth } from "./use-auth";
import { OutfitItem } from "./use-random-outfits";

export function useSavedOutfits() {
	const { user } = useAuth();
	const [ items, setItems ] = useState<OutfitItem[]>([]);
	const [ loading, setLoading ] = useState(true);

	useEffect(() => {
		if (!user) {
			setItems([]);
			setLoading(false);
			return;
		}

		setLoading(true);

		try {
            // "outfits" is the default collection name if env var is missing
			const collectionName = process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME || "outfits";
			const q = query(
				collection(db, collectionName),
				where("saved_by", "array-contains", user.uid)
			);

			const unsubscribe = onSnapshot(q, (snapshot) => {
				const fetchedItems: OutfitItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					const imgUrl = Array.isArray(data.images) && data.images.length > 0
						? data.images[ 0 ]
						: "https://placehold.co/600x400";

					fetchedItems.push({
						id: doc.id,
						img: imgUrl,
						url: `/outfit/${encodeURIComponent(doc.id)}`,
						height: 0, 
						saved_by: data.saved_by || [],
					});
				});
				setItems(fetchedItems);
				setLoading(false);
			}, (error) => {
				console.error("Error fetching saved outfits:", error);
				setLoading(false);
			});

			return () => unsubscribe();
		} catch (err) {
			console.error("Error setting up saved outfits listener:", err);
			setLoading(false);
		}
	}, [ user ]);

	return { items, loading };
}
