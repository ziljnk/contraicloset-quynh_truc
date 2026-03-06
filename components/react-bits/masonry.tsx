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
import { getResponsiveImageUrl } from "@/utils/image-variants";

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

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => {
        if (prev.width !== width || prev.height !== height) {
           return { width, height };
        }
        return prev;
      });
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
          img.onload = () => {
             // Ensure we don't return 0 dimensions if something weird happens with naturalWidth/Height
             // but successful load event
            dimensions[item.id] = {
              width: img.naturalWidth || 1,
              height: img.naturalHeight || 1,
            };
            resolve();
          };
          img.onerror = () => {
             // Try to use provided height, else default to somewhat square
            dimensions[item.id] = { width: 1, height: item.height || 1 };
            resolve();
          };
          // Set src AFTER handlers to catch cached images correctly in all environments
          img.src = item.img;
        }),
    ),
  );
  return dimensions;
};

interface Item {
  id: string;
  img: string;
  desktopImg?: string;
  mobileImg?: string;
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
  onItemClick?: (item: Item) => void;
  initialScrollOffset?: number;
}

interface MasonryItemProps {
  item: GridItem;
  imageUrl: string;
  handleBookmark: (e: React.MouseEvent, item: Item) => void;
  isSaved: boolean;
  router: any;
  canHover: boolean;
  scaleOnHover: boolean;
  hoverScale: number;
  colorShiftOnHover: boolean;
  blurToFocus: boolean;
  animateFrom: string;
  onItemClick?: (item: Item) => void;
}

const MasonryItem: React.FC<MasonryItemProps> = ({
  item,
  imageUrl,
  handleBookmark,
  isSaved,
  router,
  canHover,
  scaleOnHover,
  hoverScale,
  colorShiftOnHover,
  blurToFocus,
  onItemClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 200px 0px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => {
    if (!canHover || !ref.current) return;
    if (scaleOnHover) {
      gsap.to(ref.current, {
        scale: hoverScale,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = ref.current.querySelector(
        ".color-overlay",
      ) as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
    }
  };

  const handleMouseLeave = () => {
    if (!canHover || !ref.current) return;
    if (scaleOnHover) {
      gsap.to(ref.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = ref.current.querySelector(
        ".color-overlay",
      ) as HTMLElement;
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
    }
  };

  useLayoutEffect(() => {
    if (!ref.current) return;

    // If inView and NOT animated yet -> Animate Entry
    if (inView && !hasAnimated) {
      gsap.fromTo(
        ref.current,
        {
          x: item.x,
          y: item.y + 100,
          width: item.w,
          height: item.h,
          opacity: 0,
          ...(blurToFocus && { filter: "blur(10px)" }),
        },
        {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
          opacity: 1,
          ...(blurToFocus && { filter: "blur(0px)" }),
          duration: 0.8,
          ease: "power3.out",
        },
      );
      setHasAnimated(true);
    } else if (hasAnimated) {
      // Just update layout position (e.g. window resize)
      gsap.to(ref.current, {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      // Not in view yet, set off-screen/hidden but correct dimensions
      gsap.set(ref.current, {
        x: item.x,
        y: item.y + 100,
        width: item.w,
        height: item.h,
        opacity: 0,
      });
    }
  }, [inView, item.x, item.y, item.w, item.h, hasAnimated, blurToFocus]);

  return (
    <div
      ref={ref}
      data-key={item.id}
      className="absolute box-content group cursor-pointer"
      style={{ willChange: "transform, width, height, opacity" }}
      onClick={() => {
        if (onItemClick) {
          onItemClick(item);
        } else {
          router.push(item.url);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className={`p-1.5 rounded-full hover:bg-white transition-colors shadow-sm ${isSaved ? "bg-white" : "bg-white/90"}`}
          onClick={(e) => handleBookmark(e, item)}
        >
          <BookmarkIcon
            size={20}
            className={`${isSaved ? "text-black [&_svg]:fill-black" : "text-black"}`}
          />
        </div>
      </div>
      <div
        className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-2.5 transition-opacity duration-300"
        style={{ backgroundImage: inView ? `url(${imageUrl})` : "none" }}
      >
        {colorShiftOnHover && (
          <div className="color-overlay absolute inset-0 rounded-[10px] bg-linear-to from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  onItemClick,
  initialScrollOffset,
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

    setSavedStatus((prev) => ({ ...prev, [item.id]: newStatus }));

    try {
      const outfitRef = doc(
        db,
        process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME || "outfits",
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
      setSavedStatus((prev) => ({ ...prev, [item.id]: isSaved }));
    }
  };

  const columns = useMedia(
    ["(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"],
    [4, 3, 2],
    2,
  );
  const prefersMobileVariant = useMedia(["(max-width:768px)"], [1], 0) === 1;
  const responsiveItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        img: getResponsiveImageUrl(
          {
            desktop: item.desktopImg || item.img,
            mobile: item.mobileImg || item.img,
          },
          prefersMobileVariant,
        ),
      })),
    [items, prefersMobileVariant],
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const [dimensions, setDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const hasRestored = useRef(false);

  useEffect(() => {
    setImagesReady(false);

    preloadImages(responsiveItems).then((dims) => {
      setDimensions((prev) => ({ ...prev, ...dims }));
      setImagesReady(true);
    });
  }, [responsiveItems]);

  useEffect(() => {
    if (!hasRestored.current && imagesReady && width > 0 && initialScrollOffset !== undefined && initialScrollOffset > 0) {
      window.scrollTo({ top: initialScrollOffset, behavior: "smooth" });
      hasRestored.current = true;
    }
  }, [imagesReady, initialScrollOffset, width]);

  const grid = useMemo<GridItem[]>(() => {
    if (!width || responsiveItems.length === 0) return [];
    const colHeights = new Array(columns).fill(0);
    const gap = 16;
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    return responsiveItems.map((child) => {
      // Find the shortest column
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      const x = shortestColIndex * (columnWidth + gap);

      const dim = dimensions[child.id];
      let itemHeight = child.height;

      // if the image loaded and we have natural dimensions
      if (dim && dim.width > 0 && dim.height > 0) {
          itemHeight = (dim.height / dim.width) * columnWidth;
      } else if (itemHeight && itemHeight > 0) {
          // If we have a predefined height, we can estimate it (assuming width is roughly what it was designed for, this is tricky)
          // As a fallback, use 4:3
          itemHeight = columnWidth * (4/3); 
      }
      else {
        // Fallback to a default aspect ratio (e.g., 4:3 portrait)
        itemHeight = columnWidth * (4 / 3);
      }

      const y = colHeights[shortestColIndex];

      // Update the height of the column we just added to
      colHeights[shortestColIndex] += itemHeight + gap;
      
      return { ...child, x, y, w: columnWidth, h: itemHeight };
    });
  }, [columns, responsiveItems, width, dimensions]);

  const canHover =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
        opacity: 1,
      }}
    >
      {grid.map((item) => (
        <MasonryItem
          key={item.id}
          item={item}
          imageUrl={item.img}
          handleBookmark={handleBookmark}
          onItemClick={onItemClick}
          isSaved={!!savedStatus[item.id]}
          router={router}
          canHover={canHover}
          scaleOnHover={scaleOnHover}
          hoverScale={hoverScale}
          colorShiftOnHover={colorShiftOnHover}
          blurToFocus={blurToFocus}
          animateFrom={animateFrom}
        />
      ))}
    </div>
  );
};

export default Masonry;
