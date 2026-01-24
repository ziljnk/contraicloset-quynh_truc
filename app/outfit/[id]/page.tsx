"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/outfit/source-link";
import { OutfitItemLink } from "@/components/outfit/outfit-item-link";
import { SimilarOutfitCard } from "@/components/outfit/similar-outfit-card";

export default function OutfitDetailPage() {
	const params = useParams();
	const router = useRouter();
	// Ensure ID is properly decoded
	const rawId = params.id as string;
	const id = React.useMemo(() => {
		if (!rawId) return "";
		try {
			return decodeURIComponent(rawId);
		} catch (e) {
			return rawId;
		}
	}, [rawId]);

	const [outfit, setOutfit] = React.useState<any>(null);
	const [similarOutfits, setSimilarOutfits] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchOutfit() {
			if (!id) return;

			try {
				const docRef = doc(db, "outfits", id);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					console.log("data", data);
					
					const currentOutfitData = {
						id: docSnap.id,
						title: data.title || `#${id.slice(0, 6)}`,
						images: data.images || ["https://placehold.co/600x900"],
						source: data.image_source || "",
						aesthetic: data.aesthetic,
						occasion: data.occasion,
						formality: data.formality,
						season: data.season,
						items:
							data.product_links?.map((link: any) => ({
								url: link.link,
								label: link.name,
								type: "Sản phẩm",
							})) || [],
					};
					setOutfit(currentOutfitData);

					// Fetch candidates for similarity check
					const outfitsRef = collection(db, "outfits");
					const q = query(outfitsRef, limit(100));
					const querySnapshot = await getDocs(q);

					const candidates = querySnapshot.docs
						.map((d) => ({ id: d.id, ...d.data() } as any))
						.filter((d) => d.id !== id);

					const scoredCandidates = candidates.map((candidate) => {
						let score = 0;
						if (candidate.aesthetic && candidate.aesthetic === currentOutfitData.aesthetic) score += 3;
						if (candidate.occasion && candidate.occasion === currentOutfitData.occasion) score += 2;
						if (candidate.formality && candidate.formality === currentOutfitData.formality) score += 2;
						if (candidate.season && candidate.season === currentOutfitData.season) score += 1;
						return { ...candidate, score };
					});

					// Sort by score descending
					scoredCandidates.sort((a, b) => b.score - a.score);

					// Take top 6
					setSimilarOutfits(scoredCandidates.slice(0, 6));

				} else {
					console.log("No such document!");
				}
			} catch (error) {
				console.error("Error fetching outfit:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchOutfit();
	}, [id]);

	if (loading)
		return (
			<div className="flex h-screen items-center justify-center">
				Loading...
			</div>
		);

	if (!outfit)
		return (
			<div className="container mx-auto px-4 py-8">
				<Button
					variant="ghost"
					className="mb-6 pl-0"
					onClick={() => router.back()}
				>
					<ArrowLeft className="mr-2 h-4 w-4" /> Back
				</Button>
				<div className="text-center py-20">Outfit not found</div>
			</div>
		);

	return (
		<div className="container mx-auto px-4 py-8">
			<Button
				variant="ghost"
				className="mb-6 pl-0 hover:pl-2 transition-all"
				onClick={() => router.back()}
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to Gallery
			</Button>

			<div className="flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-200px)]">
				{/* Left side - Image Carousel */}
				<div className="w-full lg:w-3/5 bg-secondary/20 rounded-xl relative flex items-center justify-center p-4 lg:p-12">
					<Carousel className="w-full max-w-sm lg:max-w-md">
						<CarouselContent>
							{outfit.images.map(
								(image: string, index: number) => (
									<CarouselItem key={index}>
										<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-xl">
											<Image
												src={image}
												alt={`${outfit.title} - Image ${index + 1}`}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
												className="object-cover"
												priority
											/>
										</div>
									</CarouselItem>
								),
							)}
						</CarouselContent>
						{outfit.images.length > 1 && (
							<>
								<CarouselPrevious />
								<CarouselNext />
							</>
						)}
					</Carousel>
				</div>

				{/* Right side - Details */}
				<div className="w-full lg:w-2/5 flex flex-col h-full overflow-y-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold mb-4">
							{outfit.title}
						</h1>
						{outfit.source && <SourceLink url={outfit.source} />}
					</div>

					<div className="flex-1">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-semibold text-xl">
								Outfit Items
							</h2>
							<Badge variant="secondary" className="px-3 py-1">
								{outfit.items?.length || 0} items
							</Badge>
						</div>

						{outfit.items && outfit.items.length > 0 ?
							<div className="space-y-4">
								{outfit.items.map(
									(item: any, index: number) => (
										<OutfitItemLink
											key={index}
											item={item}
										/>
									),
								)}
							</div>
						:	<div className="text-muted-foreground italic p-4 bg-muted/50 rounded-lg text-center">
								No items linked to this outfit yet.
							</div>
						}
					</div>
				</div>
			</div>

			{/* Similar Outfits Section */}
			{similarOutfits.length > 0 && (
				<div className="mt-16 border-t pt-10">
					<h2 className="text-2xl font-bold mb-6">Similar Outfits</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{similarOutfits.map((outfit) => (
							<SimilarOutfitCard key={outfit.id} outfit={outfit} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
