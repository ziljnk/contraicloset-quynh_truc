"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
	doc,
	getDoc,
	collection,
	query,
	limit,
	getDocs,
    updateDoc,
    arrayUnion,
    arrayRemove,
} from "firebase/firestore";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { SourceLink } from "@/components/outfit/source-link";
import { OutfitItemLink } from "@/components/outfit/outfit-item-link";
import { SimilarOutfitCard } from "@/components/outfit/similar-outfit-card";
import { DeleteIcon } from "@/components/animated-icons/delete";
import { SquarePenIcon } from "@/components/animated-icons/square-pen";
import { useAuth } from "@/hooks/use-auth";
import { EditOutfitDialog } from "@/components/outfit/edit-outfit-dialog";
import { DeleteOutfitDialog } from "@/components/outfit/delete-outfit-dialog";
import { BookmarkIcon, type BookmarkIconHandle } from "@/components/animated-icons/bookmark";
import { useIconAnimation } from "@/hooks/use-icon-animation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackUserPreference } from "@/utils/recommendation";

export default function OutfitDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { isAdmin, user } = useAuth();
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
	const [loadingSimilar, setLoadingSimilar] = React.useState(true);
    const [imagesLoaded, setImagesLoaded] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const bookmarkIcon = useIconAnimation<BookmarkIconHandle>();

    // Track view when outfit is loaded
    React.useEffect(() => {
        if (outfit && user) {
            trackUserPreference(user.uid, outfit, 'view');
        }
    }, [outfit?.id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
    
    const handleToggleSave = async () => {
        if (!user) {
            router.push("/login");
            return;
        }
        if (!outfit) return;

        setIsSaving(true);
        // Optimistic update
        setIsSaved(!isSaved);
        if(!isSaved) {
            bookmarkIcon.events.onMouseEnter();
        } else {
             bookmarkIcon.events.onMouseLeave();
        }

        const outfitRef = doc(db, process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!, outfit.id);
        
        try {
            if (isSaved) {
                await updateDoc(outfitRef, {
                    saved_by: arrayRemove(user.uid)
                });
                toast.success("Removed from bookmarks");
            } else {
                await updateDoc(outfitRef, {
                    saved_by: arrayUnion(user.uid)
                });
                trackUserPreference(user.uid, outfit, 'save');
                toast.success("Saved to bookmarks");
            }
        } catch (error) {
            console.error("Error toggling save:", error);
            // Revert optimistic update
            setIsSaved(!isSaved);
            toast.error("Failed to update bookmark");
        } finally {
            setIsSaving(false);
        }
    };


	React.useEffect(() => {
		async function fetchOutfit() {
			if (!id) return;

			setLoading(true);
			window.scrollTo({ top: 0, behavior: "smooth" });

			try {
				const docRef = doc(
					db,
					process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!,
					id,
				);
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
                        saved_by: data.saved_by || [],
						items:
							data.product_links?.map((link: any) => ({
								url: link.link,
								label: link.name,
								type: "Sản phẩm",
							})) || [],
					};
					setOutfit(currentOutfitData);
					setLoading(false);
				} else {
					console.log("No such document!");
					setLoading(false);
                    setLoadingSimilar(false);
				}
			} catch (error) {
				console.error("Error fetching outfit:", error);
				setLoading(false);
                setLoadingSimilar(false);
			}
		}

		fetchOutfit();
	}, [id]);

    React.useEffect(() => {
        async function fetchSimilarOutfits() {
            if (!outfit || !imagesLoaded) return;
            
            try {
                // Fetch candidates for similarity check
                const outfitsRef = collection(
                    db,
                    process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!,
                );
                const q = query(outfitsRef, limit(100));
                const querySnapshot = await getDocs(q);

                const candidates = querySnapshot.docs
                    .map((d) => ({ id: d.id, ...d.data() }) as any)
                    .filter((d) => d.id !== outfit.id);

                const scoredCandidates = candidates.map((candidate) => {
                    let score = 0;
                    if (
                        candidate.aesthetic &&
                        candidate.aesthetic === outfit.aesthetic
                    )
                        score += 3;
                    if (
                        candidate.occasion &&
                        candidate.occasion === outfit.occasion
                    )
                        score += 2;
                    if (
                        candidate.formality &&
                        candidate.formality === outfit.formality
                    )
                        score += 2;
                    if (
                        candidate.season &&
                        candidate.season === outfit.season
                    )
                        score += 1;
                    return { ...candidate, score };
                });

                // Sort by score descending
                scoredCandidates.sort((a, b) => b.score - a.score);

                // Take top 6
                setSimilarOutfits(scoredCandidates.slice(0, 6));
            } catch (error) {
                console.error("Error fetching similar outfits:", error);
            } finally {
                setLoadingSimilar(false);
            }
        }

        fetchSimilarOutfits();
	}, [outfit, imagesLoaded]);

    React.useEffect(() => {
        if (outfit && user) {
            setIsSaved(outfit.saved_by?.includes(user.uid) || false);
        }
    }, [outfit, user]);

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
			<div className="flex justify-between items-center mb-6">
                <Button
                    variant="outline"
                    className="pl-0 hover:pl-2 transition-all"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </Button>

                <div className="lg:hidden">
                    <Button
                        size="icon"
                        className="rounded-full"
                        onClick={handleToggleSave}
                        disabled={isSaving}
                        {...bookmarkIcon.events}
                    >
                        <BookmarkIcon 
                            ref={bookmarkIcon.ref} 
                            size={20} 
                            className={cn(isSaved && "[&_svg]:fill-current")}
                        />
                        <span className="sr-only">Bookmark</span>
                    </Button>
                </div>
            </div>

			<div className="flex flex-col lg:flex-row gap-8">
				{/* Left side - Image Carousel */}
				<div className="w-full lg:w-3/5 bg-secondary/20 rounded-xl relative flex items-center justify-center p-4 lg:p-12">
					<Carousel className="w-full max-w-sm lg:max-w-md">
						<CarouselContent>
							{outfit.images.map(
								(image: string, index: number) => (
									<CarouselItem key={index}>
										<div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-xl bg-secondary/10">
											<Skeleton className="absolute inset-0 w-full h-full" />
											<Image
												src={image}
												alt={`${outfit.title} - Image ${index + 1}`}
												fill
												sizes="(max-width:480px) 300px, (max-width: 768px) 400px, (max-width: 1200px) 500px, 33vw"
												className="object-cover relative z-10"
												priority={index === 0}
                                                onLoad={() => {
                                                    if(index === 0) setImagesLoaded(true);
                                                }}
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
						<div className="flex justify-between items-center">
							<h1 className="text-3xl font-bold mb-4">
								{outfit.title}
							</h1>

							{isAdmin && (<div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <EditOutfitDialog outfit={outfit}>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size={"icon"} className="rounded-full">
                                                    <SquarePenIcon />
                                                </Button>
                                            </TooltipTrigger>
                                        </EditOutfitDialog>
                                        <TooltipContent>
                                            <p>Chỉnh sửa Outfit</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <DeleteOutfitDialog outfitId={outfit.id} images={outfit.images}>
                                            <TooltipTrigger asChild>
                                                <Button variant="destructive" size={"icon"} className="ml-2 rounded-full">
                                                    <DeleteIcon />
                                                </Button>
                                            </TooltipTrigger>
                                        </DeleteOutfitDialog>
                                        <TooltipContent>
                                            <p>Xóa Outfit</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
							</div>)}
						</div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Button
                                className={cn("hidden lg:inline-flex items-center rounded-full gap-2 transition-colors")}
                                onClick={handleToggleSave}
                                disabled={isSaving}
                                {...bookmarkIcon.events}
                            >
                                <BookmarkIcon 
                                    ref={bookmarkIcon.ref} 
                                    size={16} 
                                    className={cn(isSaved && "[&_svg]:fill-current")}
                                />
                                {isSaved ? "Đã lưu" : "Lưu"}
                            </Button>
						    {outfit.source && <SourceLink url={outfit.source} />}
                        </div>
					</div>

					<div className="flex-1">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-semibold text-xl">
								Nơi mua phối đồ
							</h2>
							<Badge variant="secondary" className="px-3 py-1">
								{outfit.items?.length || 0} sản phẩm
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
								Chưa có sản phẩm nào được liên kết với phối đồ này.
							</div>
						}
					</div>
				</div>
			</div>

			{/* Similar Outfits Section */}
			{(similarOutfits.length > 0 || loadingSimilar) && (
				<div className="mt-16 border-t pt-10 pb-20">
					<h2 className="text-2xl font-bold mb-6">Phối đồ tương tự</h2>
					{loadingSimilar ? (
						<div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="flex flex-col space-y-3">
									<Skeleton className="aspect-[3/4] w-full rounded-xl" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-[250px]" />
										<Skeleton className="h-4 w-[200px]" />
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
							{similarOutfits.map((outfit) => (
								<SimilarOutfitCard
									key={outfit.id}
									outfit={outfit}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
