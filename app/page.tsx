"use client";

import { useIconAnimation } from "@/hooks/use-icon-animation";
import { PlusIcon, type PlusIconHandle } from "@/components/animated-icons/plus";
import { RotateCCWIcon, type RotateCCWIconHandle } from "@/components/animated-icons/rotate-ccw";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query, orderBy, startAt, documentId } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { Sparkles, RefreshCcw } from "lucide-react";
import Masonry from "@/components/react-bits/masonry";

// Define the interface for the Masonry item
interface Item {
	id: string;
	img: string;
	url: string;
	height: number;
}

const generateRandomId = () => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let autoId = '';
	for (let i = 0; i < 20; i++) {
		autoId += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return autoId;
}

export default function Home() {
	const plusIcon = useIconAnimation<PlusIconHandle>();
	const rotateIcon = useIconAnimation<RotateCCWIconHandle>();
	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOutfits = async () => {
		setLoading(true);
		
		try {
			const outfitsCollection = collection(db, "outfits");
			const randomId = generateRandomId();
			
			// 1. Fetch 100 items starting from a random ID
			const q1 = query(outfitsCollection, orderBy(documentId()), startAt(randomId), limit(100));
			const snap1 = await getDocs(q1);
			
			let docs = snap1.docs;

			// 2. If we got fewer than 100, fetch the rest from the beginning
			if (docs.length < 100) {
				const remaining = 100 - docs.length;
				const q2 = query(outfitsCollection, orderBy(documentId()), limit(remaining));
				const snap2 = await getDocs(q2);
				docs = [...docs, ...snap2.docs];
			}

			// 3. Map to Items and De-duplicate
			const uniqueItems = new Map<string, Item>();
			
			docs.forEach((doc) => {
				if (uniqueItems.has(doc.id)) return;

				const data = doc.data();
				// Get the first image from the images array, fallback to placeholder
				const imgUrl = Array.isArray(data.images) && data.images.length > 0 
					? data.images[0] 
					: "https://placehold.co/600x400";
				
				uniqueItems.set(doc.id, {
					id: doc.id,
					img: imgUrl,
					url: `/outfit/${encodeURIComponent(doc.id)}`,
					height: 0, // Height will be calculated by Masonry based on image aspect ratio
				});
			});

			// 4. Shuffle the items to give a more random feel
			const shuffledItems = Array.from(uniqueItems.values()).sort(() => Math.random() - 0.5);
			setItems(shuffledItems);

		} catch (error) {
			console.error("Error fetching outfits:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOutfits();
	}, []);

	return (
		<div className="container mx-auto py-8 px-4 md:px-12">
			<div className="flex justify-end items-center gap-5 mb-10">
				<Button 
					variant={"outline"}
					{...plusIcon.events}
					className="rounded-full"
				>
					<PlusIcon ref={plusIcon.ref} />
					Create outfit
				</Button>
				<Button 
					variant={"outline"}
					{...rotateIcon.events}
					onClick={() => {
						fetchOutfits();
						rotateIcon.ref.current?.startAnimation();
					}}
					className="rounded-lg"
				>
					<RotateCCWIcon ref={rotateIcon.ref} />
					Reload
				</Button>
			</div>

			{loading ? (
				<div className="flex justify-center p-10">
					Loading...
				</div>
			) : (
				<>
					<Masonry
						items={items}
						ease="power3.out"
						duration={0.6}
						stagger={0.05}
						animateFrom="bottom"
						scaleOnHover
						hoverScale={0.95}
						blurToFocus
						colorShiftOnHover={false}
					/>
					
					{items.length > 0 && (
						<div className="flex flex-col items-center justify-center pt-20 pb-10">
							<div className="mb-4">
								<Sparkles className="h-8 w-8 text-gray-300 fill-current" />
							</div>
							
							<h3 className="text-lg font-semibold text-[#342e29] mb-1">
								Bạn đã xem hết!
							</h3>
							
							<p className="text-gray-500 text-sm mb-6">
								Bạn đã xem tất cả các set đồ hiện có.
							</p>
							
							<Button 
								variant="outline"
								onClick={() => {
									window.scrollTo({ top: 0, behavior: 'smooth' });
									fetchOutfits();
								}}
								className="rounded-xl px-6 gap-2 border-gray-200 text-gray-600 hover:text-gray-900"
							>
								<RefreshCcw className="h-4 w-4" />
								Tải lại để xem set đồ khác
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
