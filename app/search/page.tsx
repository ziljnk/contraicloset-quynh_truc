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
import { useEffect, useState } from "react";
import Loader from "@/components/custom/Loader";

interface OutfitItem {
	id: string;
	img: string;
	url: string;
	height: number;
	saved_by: string[];
}

const generateRandomId = () => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let autoId = '';
	for (let i = 0; i < 20; i++) {
		autoId += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return autoId;
}

export default function SearchPage() {
	const [ items, setItems ] = useState<OutfitItem[]>([]);
	const [ loading, setLoading ] = useState(true);

	// Filter states
	const [ aesthetic, setAesthetic ] = useState("all");
	const [ occasion, setOccasion ] = useState("all");
	const [ formality, setFormality ] = useState("all");
	const [ season, setSeason ] = useState("all");
	const [ color, setColor ] = useState("all");
	const [ keyword, setKeyword ] = useState("");

	const fetchOutfits = async () => {
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
					const imgUrl = Array.isArray(data.images) && data.images.length > 0 ? data.images[ 0 ] : "https://placehold.co/600x400";
					uniqueItems.set(doc.id, {
						id: doc.id,
						img: imgUrl,
						url: `/outfit/${encodeURIComponent(doc.id)}`,
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

				// Note: complex queries might require composite indexes in Firestore
				const q = query(outfitsCollection, ...constraints, limit(50));
				const snapshot = await getDocs(q);

				const fetchedItems: OutfitItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();

					// Basic Text Search implementation
					if (keyword.trim() !== "") {
						const lowerKeyword = keyword.toLowerCase();
						const title = (data.title || "").toLowerCase();
						const id = (data.id || "").toLowerCase();

						// Search in both title and id
						if (!title.includes(lowerKeyword) && !id.includes(lowerKeyword)) {
							return;
						}
					}

					const imgUrl = Array.isArray(data.images) && data.images.length > 0 ? data.images[ 0 ] : "https://placehold.co/600x400";
					fetchedItems.push({
						id: doc.id,
						img: imgUrl,
						url: `/outfit/${encodeURIComponent(doc.id)}`,
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
	};

	useEffect(() => {
		fetchOutfits();
	}, [ aesthetic, occasion, formality, season, color, keyword ]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 space-y-6 w-full flex flex-col items-center justify-start">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Find and Discovery
					</h1>
					<p className="text-muted-foreground text-lg">
						Find your inspiration
					</p>
				</div>

				<div className="flex w-full items-center space-x-2 mb-4">
					<Input
						type="search"
						placeholder="Search..."
						value={ keyword }
						onChange={ (e) => setKeyword(e.target.value) }
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>

				<div className="flex w-full gap-2 overflow-x-auto pb-2 items-center justify-start md:justify-center no-scrollbar">
					<Select value={ aesthetic } onValueChange={ setAesthetic }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Aesthetic" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="minimal">Minimal</SelectItem>
							<SelectItem value="old_money">
								Old money / Quiet luxury
							</SelectItem>
							<SelectItem value="streetwear">
								Streetwear
							</SelectItem>
							<SelectItem value="smart_casual">
								Smart casual
							</SelectItem>
							<SelectItem value="business_casual">
								Business casual
							</SelectItem>
							<SelectItem value="vintage">Vintage</SelectItem>
							<SelectItem value="k_fashion">K-fashion</SelectItem>
							<SelectItem value="sporty_athleisure">
								Sporty / Athleisure
							</SelectItem>
						</SelectContent>
					</Select>
					<Select value={ occasion } onValueChange={ setOccasion }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Dịp" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="di_hoc">Đi học</SelectItem>
							<SelectItem value="di_lam">Đi làm</SelectItem>
							<SelectItem value="di_cafe">Đi cafe</SelectItem>
							<SelectItem value="hen_ho">Hẹn hò</SelectItem>
							<SelectItem value="di_bien">Đi biển</SelectItem>
							<SelectItem value="du_tiec">Đi tiệc</SelectItem>
						</SelectContent>
					</Select>
					<Select value={ formality } onValueChange={ setFormality }>
						<SelectTrigger className="w-35 rounded-full">
							<SelectValue placeholder="Trang trọng" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="casual">Casual</SelectItem>
							<SelectItem value="smart_casual">
								Smart casual
							</SelectItem>
							<SelectItem value="business_casual">
								Business casual
							</SelectItem>
							<SelectItem value="semi_formal">
								Semi-formal
							</SelectItem>
							<SelectItem value="formal">Formal</SelectItem>
						</SelectContent>
					</Select>
					<Select value={ season } onValueChange={ setSeason }>
						<SelectTrigger className="w-27.5 rounded-full">
							<SelectValue placeholder="Mùa" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							<SelectItem value="xuan">Xuân</SelectItem>
							<SelectItem value="ha">Hạ</SelectItem>
							<SelectItem value="thu">Thu</SelectItem>
							<SelectItem value="dong">Đông</SelectItem>
						</SelectContent>
					</Select>
					<Select value={ color } onValueChange={ setColor }>
						<SelectTrigger className="w-30 rounded-full">
							<SelectValue placeholder="Màu sắc" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả</SelectItem>
							<SelectItem value="neutral_light">
								Trắng / Be / Neutral sáng
							</SelectItem>
							<SelectItem value="black_grey">
								Đen / Xám đậm
							</SelectItem>
							<SelectItem value="navy_blue">
								Navy / Xanh dương
							</SelectItem>
							<SelectItem value="brown_earth">
								Nâu / Earth tone
							</SelectItem>
							<SelectItem value="pastel">Pastel</SelectItem>
							<SelectItem value="bright_colors">
								Màu nổi bật
							</SelectItem>
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
				/>
			) }
		</div>
	);
}
