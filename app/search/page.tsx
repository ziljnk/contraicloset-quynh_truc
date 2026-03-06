"use client";

import Masonry from "@/components/react-bits/masonry";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { db } from "@/utils/firebase";
import { collection, documentId, getDocs, limit, orderBy, query, startAt, where } from "firebase/firestore";
import { useCallback, useEffect } from "react";
import Loader from "@/components/custom/Loader";
import { 
  AESTHETIC_VIBE_OPTIONS, 
  OCCASION_OPTIONS, 
  FORMALITY_OPTIONS, 
  SEASON_OPTIONS, 
  COLOR_PALETTE_OPTIONS 
} from "@/constant/outfit-options";
import { useOutfitsContext, type OutfitItem } from "@/context/outfits-context";
import { useRouter } from "next/navigation";
import { getPrimaryOutfitImageSources } from "@/utils/image-variants";

const generateRandomId = () => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let autoId = '';
	for (let i = 0; i < 20; i++) {
		autoId += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return autoId;
}

export default function SearchPage() {
	const router = useRouter();
	const {
		searchItems: items,
		setSearchItems: setItems,
		searchLoading: loading,
		setSearchLoading: setLoading,
		searchFilters,
		setSearchFilters,
		searchScrollPosition,
		setSearchScrollPosition,
		executedFilterKey,
		setExecutedFilterKey
	} = useOutfitsContext();

	const { aesthetic, occasion, formality, season, color, keyword } = searchFilters;

	const handleFilterChange = (key: keyof typeof searchFilters, value: string) => {
		setSearchFilters(prev => ({ ...prev, [key]: value }));
	};

	const fetchOutfits = useCallback(async () => {
		setLoading(true);
		setItems([]);

		try {
			const outfitsCollection = collection(db, process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!);

			// Check if any filter is active
			const hasFilters =
				(aesthetic && aesthetic !== "all") ||
				(occasion && occasion !== "all") ||
				(formality && formality !== "all") ||
				(season && season !== "all") ||
				(color && color !== "all") ||
				(keyword.trim() !== "");

			if (!hasFilters) {
				// Random fetch logic
				const randomId = generateRandomId();
				const count = 50;

				const q1 = query(outfitsCollection, orderBy(documentId()), startAt(randomId), limit(count));
				const snap1 = await getDocs(q1);

				let docs = snap1.docs;

				if (docs.length < count) {
					const remaining = count - docs.length;
					const q2 = query(outfitsCollection, orderBy(documentId()), limit(remaining));
					const snap2 = await getDocs(q2);
					docs = [ ...docs, ...snap2.docs ];
				}

				const uniqueItems = new Map<string, OutfitItem>();
				docs.forEach((doc) => {
					if (uniqueItems.has(doc.id)) return;
					const data = doc.data();
					const primaryImage = getPrimaryOutfitImageSources(data);
					uniqueItems.set(doc.id, {
						id: doc.id,
						img: primaryImage.desktop,
						desktopImg: primaryImage.desktop,
						mobileImg: primaryImage.mobile,
						url: `/outfit/${(data.title || doc.id).replace(/^#/, '')}`,
						height: 0,
						saved_by: data.saved_by || [],
					});
				});

				setItems(Array.from(uniqueItems.values()).sort(() => Math.random() - 0.5));
			} else {
				// Filtered fetch logic
				let constraints = [];

				if (aesthetic && aesthetic !== "all") constraints.push(where("aesthetic_vibe", "==", aesthetic));
				if (occasion && occasion !== "all") constraints.push(where("occasion", "==", occasion));
				if (formality && formality !== "all") constraints.push(where("formality", "==", formality));
				if (season && season !== "all") constraints.push(where("season", "==", season));
				if (color && color !== "all") constraints.push(where("color_palette", "==", color));

				if (keyword.trim() !== "") {
					let searchTitle = keyword.trim();
					if (!searchTitle.startsWith("#")) {
						searchTitle = "#" + searchTitle;
					}
					constraints.push(where("title", "==", searchTitle));
				}

				// Note: complex queries might require composite indexes in Firestore
				const q = query(outfitsCollection, ...constraints, limit(50));
				const snapshot = await getDocs(q);

				const fetchedItems: OutfitItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					const primaryImage = getPrimaryOutfitImageSources(data);
					fetchedItems.push({
						id: doc.id,
						img: primaryImage.desktop,
						desktopImg: primaryImage.desktop,
						mobileImg: primaryImage.mobile,
						url: `/outfit/${(data.title || doc.id).replace(/^#/, '')}`,
						saved_by: data.saved_by || [],
						height: 0,
					});
				});

				setItems(fetchedItems);
			}

		} catch (error) {
			console.error("Error fetching outfits:", error);
		} finally {
			setLoading(false);
		}
	}, [aesthetic, occasion, formality, season, color, keyword, setItems, setLoading]);

	useEffect(() => {
		const currentFilterKey = JSON.stringify(searchFilters);
		// Only fetch if filters have changed relative to the last execution
		// OR if we have no items (e.g. initial load even if key is empty string)
		// But be careful: empty key matches "all" but items might be empty because it hasn't loaded yet.
		// So we check if key changed OR items is empty.
		if (currentFilterKey !== executedFilterKey || (items.length === 0 && loading)) {
			fetchOutfits();
			setExecutedFilterKey(currentFilterKey);
		}
	}, [searchFilters, executedFilterKey, items.length, fetchOutfits, setExecutedFilterKey, loading]);

	return (
		<div className="container mx-auto px-4 py-30 md:px-12">
			<div className="mb-8 space-y-6 w-full flex flex-col items-center justify-start">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Tìm kiếm & Khám phá
					</h1>
					<p className="text-muted-foreground text-lg">
						Tìm cảm hứng phối đồ hoàn hảo của bạn
					</p>
				</div>

				<div className="flex w-full items-center space-x-2 mb-4">
					<Input
						type="search"
						placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
						value={ keyword }
						onChange={ (e) => handleFilterChange("keyword", e.target.value) }
						className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>

				<div className="flex flex-wrap w-full gap-2 overflow-x-auto py-2 items-center justify-start md:justify-center no-scrollbar">
					<Select value={ aesthetic } onValueChange={ (val) => handleFilterChange("aesthetic", val) }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Aesthetic" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							{AESTHETIC_VIBE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={ occasion } onValueChange={ (val) => handleFilterChange("occasion", val) }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Dịp" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							{OCCASION_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={ formality } onValueChange={ (val) => handleFilterChange("formality", val) }>
						<SelectTrigger className="w-35 rounded-full">
							<SelectValue placeholder="Trang trọng" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							{FORMALITY_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={ season } onValueChange={ (val) => handleFilterChange("season", val) }>
						<SelectTrigger className="w-27.5 rounded-full">
							<SelectValue placeholder="Mùa" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							{SEASON_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={ color } onValueChange={ (val) => handleFilterChange("color", val) }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Màu sắc" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							{COLOR_PALETTE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{ loading ? (
				<div className="flex justify-center p-10">
					<Loader />
				</div>
			) : (
				<Masonry
					items={ items }
					ease="power3.out"
					duration={ 0.6 }
					stagger={ 0.05 }
					animateFrom="bottom"
					scaleOnHover
					hoverScale={ 0.95 }
					blurToFocus
					colorShiftOnHover={ false }
					initialScrollOffset={searchScrollPosition}
					onItemClick={(item) => {
						setSearchScrollPosition(window.scrollY);
						router.push(item.url);
					}}
				/>
			) }
		</div>
	);
}
