"use client";

import React, {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { BookmarkIcon } from "../animated-icons/bookmark";
import { useAuth } from "@/hooks/use-auth";
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { toast } from "sonner";

const useMedia = (
	queries: string[],
	values: number[],
	defaultValue: number,
): number => {
	const get = () => {
		if (typeof window === "undefined") return defaultValue;
		return (
			values[queries.findIndex((q) => window.matchMedia(q).matches)] ??
			defaultValue
		);
	};

	const [value, setValue] = useState<number>(get);

	useEffect(() => {
		const handler = () => setValue(get);
		queries.forEach((q) =>
			window.matchMedia(q).addEventListener("change", handler),
		);
		return () =>
			queries.forEach((q) =>
				window.matchMedia(q).removeEventListener("change", handler),
			);
	}, [queries]);

	return value;
};

const useMeasure = <T extends HTMLElement>() => {
	const ref = useRef<T | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		if (!ref.current) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSize({ width, height });
		});
		ro.observe(ref.current);
		return () => ro.disconnect();
	}, []);

	return [ref, size] as const;
};

const preloadImages = async (
	items: Item[],
): Promise<Record<string, { width: number; height: number }>> => {
	const dimensions: Record<string, { width: number; height: number }> = {};
	await Promise.all(
		items.map(
			(item) =>
				new Promise<void>((resolve) => {
					const img = new Image();
					img.src = item.img;
					img.onload = () => {
						dimensions[item.id] = {
							width: img.naturalWidth,
							height: img.naturalHeight,
						};
						resolve();
					};
					img.onerror = () => {
						dimensions[item.id] = { width: 1, height: 1 };
						resolve();
					};
				}),
		),
	);
	return dimensions;
};

interface Item {
	id: string;
	img: string;
	url: string;
	height: number;
	saved_by?: string[];
}

interface GridItem extends Item {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface MasonryProps {
	items: Item[];
	ease?: string;
	duration?: number;
	stagger?: number;
	animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
	scaleOnHover?: boolean;
	hoverScale?: number;
	blurToFocus?: boolean;
	colorShiftOnHover?: boolean;
}

const Masonry: React.FC<MasonryProps> = ({
	items,
	ease = "power3.out",
	duration = 0.6,
	stagger = 0.05,
	animateFrom = "bottom",
	scaleOnHover = true,
	hoverScale = 0.95,
	blurToFocus = true,
	colorShiftOnHover = false,
}) => {
	const router = useRouter();
	const { user } = useAuth();
	const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!user) {
			setSavedStatus({});
			return;
		}
		const status: Record<string, boolean> = {};
		items.forEach((item) => {
			// Only set if not already set (to preserve optimistic updates during re-renders if applicable)
			// But fundamentally we should trust the prop unless we just changed it.
			// Currently simplified: always sync from props when they change.
			status[item.id] = item.saved_by?.includes(user.uid) || false;
		});
		setSavedStatus(status);
	}, [items, user]);

	const handleBookmark = async (e: React.MouseEvent, item: Item) => {
		e.stopPropagation();
		if (!user) {
			toast.error("Vui lòng đăng nhập để lưu bộ trang phục này");
			router.push("/login");
			return;
		}

		const isSaved = savedStatus[item.id];
		const newStatus = !isSaved;

		// Optimistic update
		setSavedStatus((prev) => ({ ...prev, [item.id]: newStatus }));

		try {
			const outfitRef = doc(
				db,
				process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME ||
					"outfits",
				item.id,
			);
			if (newStatus) {
				await updateDoc(outfitRef, {
					saved_by: arrayUnion(user.uid),
				});
				toast.success("Đã lưu vào bộ sưu tập của bạn");
			} else {
				await updateDoc(outfitRef, {
					saved_by: arrayRemove(user.uid),
				});
				toast.success("Đã xóa khỏi bộ sưu tập của bạn");
			}
		} catch (error) {
			console.error("Error updating bookmark:", error);
			toast.error("Có lỗi xảy ra, vui lòng thử lại");
			// Revert on error
			setSavedStatus((prev) => ({ ...prev, [item.id]: isSaved }));
		}
	};

	const columns = useMedia(
		["(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"],
		[4, 3, 2],
		2,
	);

	const [containerRef, { width }] = useMeasure<HTMLDivElement>();
	const [imagesReady, setImagesReady] = useState(false);
	const [dimensions, setDimensions] = useState<
		Record<string, { width: number; height: number }>
	>({});

	const getInitialPosition = (item: GridItem) => {
		const containerRect = containerRef.current?.getBoundingClientRect();
		if (!containerRect) return { x: item.x, y: item.y };

		let direction = animateFrom;
		if (animateFrom === "random") {
			const dirs = ["top", "bottom", "left", "right"];
			direction = dirs[
				Math.floor(Math.random() * dirs.length)
			] as typeof animateFrom;
		}

		switch (direction) {
			case "top":
				return { x: item.x, y: -200 };
			case "bottom":
				return { x: item.x, y: window.innerHeight + 200 };
			case "left":
				return { x: -200, y: item.y };
			case "right":
				return { x: window.innerWidth + 200, y: item.y };
			case "center":
				return {
					x: containerRect.width / 2 - item.w / 2,
					y: containerRect.height / 2 - item.h / 2,
				};
			default:
				return { x: item.x, y: item.y + 100 };
		}
	};

	useEffect(() => {
		// Reset ready state when items change to prevent showing stack of unmeasured items
		if (items.some(item => !dimensions[item.id])) {
			setImagesReady(false);
		}
		
		preloadImages(items).then((dims) => {
			// Merge with existing dimensions to avoid reloading known images
			setDimensions(prev => ({ ...prev, ...dims }));
			setImagesReady(true);
		});
	}, [items]);

	const grid = useMemo<GridItem[]>(() => {
		if (!width) return [];
		const colHeights = new Array(columns).fill(0);
		const gap = 16;
		const totalGaps = (columns - 1) * gap;
		const columnWidth = (width - totalGaps) / columns;

		return items.map((child) => {
			const col = colHeights.indexOf(Math.min(...colHeights));
			const x = col * (columnWidth + gap);

			const dim = dimensions[child.id];
			let height = child.height;

			if (dim && dim.width > 0) {
				// Calculate proportional height based on column width
				height = (dim.height / dim.width) * columnWidth;
			}

			const y = colHeights[col];

			colHeights[col] += height + gap;
			return { ...child, x, y, w: columnWidth, h: height };
		});
	}, [columns, items, width, dimensions]);

	const hasMounted = useRef(false);

	useLayoutEffect(() => {
		if (!imagesReady) return;

		grid.forEach((item, index) => {
			const selector = `[data-key="${item.id}"]`;
			const animProps = {
				x: item.x,
				y: item.y,
				width: item.w,
				height: item.h,
			};

			if (!hasMounted.current) {
				const start = getInitialPosition(item);
				gsap.fromTo(
					selector,
					{
						opacity: 0,
						x: start.x,
						y: start.y,
						width: item.w,
						height: item.h,
						...(blurToFocus && { filter: "blur(10px)" }),
					},
					{
						opacity: 1,
						...animProps,
						...(blurToFocus && { filter: "blur(0px)" }),
						duration: 0.8,
						ease: "power3.out",
						delay: index * stagger,
					},
				);
			} else {
				gsap.to(selector, {
					...animProps,
					duration,
					ease,
					overwrite: "auto",
				});
			}
		});

		hasMounted.current = true;
	}, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

	const canHover =
		typeof window !== "undefined" &&
		window.matchMedia("(hover: hover) and (pointer: fine)").matches;

	const handleMouseEnter = (id: string, element: HTMLElement) => {
		if (!canHover) return;
		if (scaleOnHover) {
			gsap.to(`[data-key="${id}"]`, {
				scale: hoverScale,
				duration: 0.3,
				ease: "power2.out",
			});
		}
		if (colorShiftOnHover) {
			const overlay = element.querySelector(
				".color-overlay",
			) as HTMLElement;
			if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
		}
	};

	const handleMouseLeave = (id: string, element: HTMLElement) => {
		if (!canHover) return;
		if (scaleOnHover) {
			gsap.to(`[data-key="${id}"]`, {
				scale: 1,
				duration: 0.3,
				ease: "power2.out",
			});
		}
		if (colorShiftOnHover) {
			const overlay = element.querySelector(
				".color-overlay",
			) as HTMLElement;
			if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
		}
	};

	const containerHeight = useMemo(() => {
		if (!grid.length) return 0;
		return Math.max(...grid.map((item) => item.y + item.h));
	}, [grid]);

	return (
		<div
			ref={containerRef}
			className="relative w-full transition-opacity duration-300"
			style={{ 
				height: containerHeight,
				opacity: imagesReady ? 1 : 0
			}}
		>
			{grid.map((item) => (
				<div
					key={item.id}
					data-key={item.id}
					className="absolute box-content group cursor-pointer"
					style={{ willChange: "transform, width, height, opacity" }}
					onClick={() => router.push(item.url)}
					onMouseEnter={(e) =>
						handleMouseEnter(item.id, e.currentTarget)
					}
					onMouseLeave={(e) =>
						handleMouseLeave(item.id, e.currentTarget)
					}
				>
					<div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
						<div
							className={`p-1.5 rounded-full hover:bg-white transition-colors shadow-sm ${savedStatus[item.id] ? "bg-white" : "bg-white/90"}`}
							onClick={(e) => handleBookmark(e, item)}
						>
							<BookmarkIcon
								size={20}
								className={`${savedStatus[item.id] ? "text-black [&_svg]:fill-black" : "text-black"}`}
							/>
						</div>
					</div>
					<div
						className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-2.5"
						style={{ backgroundImage: `url(${item.img})` }}
					>
						{colorShiftOnHover && (
							<div className="color-overlay absolute inset-0 rounded-[10px] bg-linear-to from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
						)}
					</div>
				</div>
			))}
		</div>
	);
};

export default Masonry;
