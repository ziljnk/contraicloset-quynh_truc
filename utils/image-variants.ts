export const DEFAULT_OUTFIT_IMAGE_FALLBACK = "https://placehold.co/600x900";

export interface OutfitImageVariantMap {
	desktop?: string | null;
	mobile?: string | null;
	[key: string]: string | null | undefined;
}

export interface OutfitImageObject {
	original_url?: string | null;
	variants?: OutfitImageVariantMap | null;
}

export type OutfitImageInput = OutfitImageObject | string | null | undefined;

export interface OutfitImageSources {
	desktop: string;
	mobile: string;
	original?: string;
}

interface OutfitImageDocumentLike {
	outfit_images?: OutfitImageInput[] | null;
	images?: string[] | null;
	imageUrl?: string | null;
}

const sanitizeUrl = (value?: string | null) => {
	if (typeof value !== "string") return undefined;
	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : undefined;
};

export function normalizeOutfitImageSources(
	image: OutfitImageInput,
	fallback: string = DEFAULT_OUTFIT_IMAGE_FALLBACK,
): OutfitImageSources {
	if (typeof image === "string") {
		const resolvedUrl = sanitizeUrl(image) || fallback;
		return {
			desktop: resolvedUrl,
			mobile: resolvedUrl,
		};
	}

	const desktopVariant = sanitizeUrl(image?.variants?.desktop);
	const mobileVariant = sanitizeUrl(image?.variants?.mobile);
	const originalUrl = sanitizeUrl(image?.original_url);

	return {
		desktop: desktopVariant || originalUrl || mobileVariant || fallback,
		mobile: mobileVariant || originalUrl || desktopVariant || fallback,
		original: originalUrl,
	};
}

export function getResponsiveImageUrl(
	sources: OutfitImageSources,
	preferMobile: boolean,
) {
	return preferMobile ? sources.mobile : sources.desktop;
}

export function getOutfitImageSourceList(
	data: OutfitImageDocumentLike,
	fallback: string = DEFAULT_OUTFIT_IMAGE_FALLBACK,
) {
	if (Array.isArray(data.outfit_images) && data.outfit_images.length > 0) {
		return data.outfit_images.map((image) =>
			normalizeOutfitImageSources(image, fallback),
		);
	}

	if (Array.isArray(data.images) && data.images.length > 0) {
		return data.images.map((image) => normalizeOutfitImageSources(image, fallback));
	}

	if (data.imageUrl) {
		return [normalizeOutfitImageSources(data.imageUrl, fallback)];
	}

	return [normalizeOutfitImageSources(undefined, fallback)];
}

export function getPrimaryOutfitImageSources(
	data: OutfitImageDocumentLike,
	fallback: string = DEFAULT_OUTFIT_IMAGE_FALLBACK,
) {
	return getOutfitImageSourceList(data, fallback)[0];
}

export function collectOutfitImageUrls(
	data: OutfitImageDocumentLike,
	fallback?: string,
) {
	return Array.from(
		new Set(
			getOutfitImageSourceList(data, fallback)
				.flatMap((source) => [source.desktop, source.mobile, source.original])
				.filter((url): url is string => Boolean(url)),
		),
	);
}