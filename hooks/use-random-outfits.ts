import { useOutfitsContext, type OutfitItem } from "@/context/outfits-context";

export type { OutfitItem };

export function useRandomOutfits(count: number = 50) {
	const { items, loading, refetch } = useOutfitsContext();

	const handleRefetch = () => {
		return refetch(count);
	};

	return { items, loading, refetch: handleRefetch };
}
