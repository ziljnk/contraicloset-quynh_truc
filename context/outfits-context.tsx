"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { collection, getDocs, limit, query, orderBy, startAt, documentId, doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useAuth } from "@/hooks/use-auth";
import { calculateOutfitScore } from "@/utils/recommendation";

export interface OutfitItem {
	id: string;
	img: string;
	url: string;
	height: number;
	saved_by: string[];
}

interface OutfitsContextType {
	items: OutfitItem[];
	loading: boolean;
	refetch: (count?: number) => Promise<void>;
	scrollPosition: number;
	setScrollPosition: (position: number) => void;
}

const OutfitsContext = createContext<OutfitsContextType | undefined>(undefined);

const generateRandomId = () => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let autoId = '';
	for (let i = 0; i < 20; i++) {
		autoId += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return autoId;
}

export function OutfitsProvider({ children }: { children: ReactNode }) {
	const { user, loading: authLoading } = useAuth();
	const [items, setItems] = useState<OutfitItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [scrollPosition, setScrollPosition] = useState(0);
	
	// Track if we have already fetched initially
	const [hasFetched, setHasFetched] = useState(false);

	const fetchOutfits = useCallback(async (count: number = 50) => {
		setLoading(true);

		try {
			const outfitsCollection = collection(db, process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!);
			const randomId = generateRandomId();

			// 1. Fetch count items starting from a random ID
			const q1 = query(outfitsCollection, orderBy(documentId()), startAt(randomId), limit(count));
			const snap1 = await getDocs(q1);

			let docs = snap1.docs;

			// 2. If we got fewer than count, fetch the rest from the beginning
			if (docs.length < count) {
				const remaining = count - docs.length;
				const q2 = query(outfitsCollection, orderBy(documentId()), limit(remaining));
				const snap2 = await getDocs(q2);
				docs = [ ...docs, ...snap2.docs ];
			}

			let hasSorted = false;

			// Apply Personalization if user is logged in
			if (user) {
				try {
					const prefSnap = await getDoc(doc(db, 'user_preferences', user.uid));
					if (prefSnap.exists()) {
						const prefs = prefSnap.data();
						const scoredDocs = docs.map(d => {
							const data = d.data();
							// Add random jitter to break ties and shuffle items with same score
							const score = calculateOutfitScore(data, prefs) + Math.random();
							return { doc: d, score };
						});

						// Sort descending by score
						scoredDocs.sort((a, b) => b.score - a.score);
						docs = scoredDocs.map(item => item.doc);
						hasSorted = true;
					}
				} catch (err) {
					console.error("Error fetching user preferences:", err);
				}
			}

			// 3. Map to Items and De-duplicate
			const uniqueItems = new Map<string, OutfitItem>();

			docs.forEach((d) => {
				if (uniqueItems.has(d.id)) return;

				const data = d.data();
				// Get the first image from the images array, fallback to placeholder
				const imgUrl = Array.isArray(data.images) && data.images.length > 0
					? data.images[ 0 ]
					: "https://placehold.co/600x400";

				uniqueItems.set(d.id, {
					id: d.id,
					img: imgUrl,
					url: `/outfit/${encodeURIComponent(d.id)}`,
					height: 0, // Height will be calculated by Masonry based on image aspect ratio
					saved_by: data.saved_by || [],
				});
			});

			// 4. If NOT logged in (or no history), shuffle randomly. If logged in with history, keep the sorted order.
			let finalItems = Array.from(uniqueItems.values());
			
			if (!hasSorted) {
				finalItems = finalItems.sort(() => Math.random() - 0.5);
			}

			setItems(finalItems);
			setHasFetched(true);

		} catch (error) {
			console.error("Error fetching outfits:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	// Initial fetch - only if we haven't fetched yet and auth is determined
	useEffect(() => {
		if (!hasFetched && !authLoading) {
			fetchOutfits(100);
		}
	}, [fetchOutfits, hasFetched, authLoading]);

	return (
		<OutfitsContext.Provider value={{ items, loading, refetch: fetchOutfits, scrollPosition, setScrollPosition }}>
			{children}
		</OutfitsContext.Provider>
	);
}

export function useOutfitsContext() {
	const context = useContext(OutfitsContext);
	if (context === undefined) {
		throw new Error("useOutfitsContext must be used within an OutfitsProvider");
	}
	return context;
}
