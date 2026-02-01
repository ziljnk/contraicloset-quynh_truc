"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { collection, getDocs, limit, query, orderBy, startAt, documentId } from "firebase/firestore";
import { db } from "@/utils/firebase";

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
	const [items, setItems] = useState<OutfitItem[]>([]);
	const [loading, setLoading] = useState(true);
	
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

			// 3. Map to Items and De-duplicate
			const uniqueItems = new Map<string, OutfitItem>();

			docs.forEach((doc) => {
				if (uniqueItems.has(doc.id)) return;

				const data = doc.data();
				// Get the first image from the images array, fallback to placeholder
				const imgUrl = Array.isArray(data.images) && data.images.length > 0
					? data.images[ 0 ]
					: "https://placehold.co/600x400";

				uniqueItems.set(doc.id, {
					id: doc.id,
					img: imgUrl,
					url: `/outfit/${encodeURIComponent(doc.id)}`,
					height: 0, // Height will be calculated by Masonry based on image aspect ratio
					saved_by: data.saved_by || [],
				});
			});

			// 4. Shuffle the items to give a more random feel
			const shuffledItems = Array.from(uniqueItems.values()).sort(() => Math.random() - 0.5);
			setItems(shuffledItems);
			setHasFetched(true);

		} catch (error) {
			console.error("Error fetching outfits:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial fetch - only if we haven't fetched yet
	useEffect(() => {
		if (!hasFetched) {
			fetchOutfits(100);
		}
	}, [fetchOutfits, hasFetched]);

	return (
		<OutfitsContext.Provider value={{ items, loading, refetch: fetchOutfits }}>
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
