"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { cn } from "@/lib/utils";

import {
	AESTHETIC_VIBE_OPTIONS,
	OCCASION_OPTIONS,
	FORMALITY_OPTIONS,
	SEASON_OPTIONS,
	COLOR_PALETTE_OPTIONS,
	MATERIAL_OPTIONS,
	PATTERN_OPTIONS,
	FIT_OPTIONS,
	LAYERING_OPTIONS,
	CATEGORY_OPTIONS,
} from "@/constant/outfit-options";

interface EditOutfitDialogProps {
	outfit: any;
    children?: React.ReactNode;
	onSuccess?: () => void;
}

export function EditOutfitDialog({
	outfit,
    children,
	onSuccess,
}: EditOutfitDialogProps) {
    const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
    const [container, setContainer] = useState<HTMLElement | null>(null);
	const [formData, setFormData] = useState({
		title: "",
		imageSource: "",
		aesthetic: [] as string[],
		occasion: [] as string[],
		formality: [] as string[],
		season: [] as string[],
		mainColor: [] as string[],
		material: [] as string[],
		pattern: [] as string[],
		fit: [] as string[],
		layerCount: [] as string[],
	});
	const [mainComponents, setMainComponents] = useState<string[]>([]);
	const [productLinks, setProductLinks] = useState<
		{ name: string; link: string }[]
	>([]);

	// Helper to safe split
	const safeSplit = (val: any) => {
		if (Array.isArray(val)) return val;
		if (typeof val === "string" && val) return val.split("_");
		return [];
	};


    // Helper to map single string value to array for MultiSelect
    const mapStringToArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string" && val) return [val];
        return [];
    }
    
    // Helper to parse complex underscore strings into valid options
    const parseOutfitString = (val: any, options: {value: string}[]) => {
        if (Array.isArray(val)) return val;
        if (!val || typeof val !== 'string') return [];
        
        // 1. Exact match
        if(options.some(o => o.value === val)) return [val];
        
        // 2. Greedy match
        // Split by underscore but then try to reconstruct
        const parts = val.split('_');
        const result: string[] = [];
        let i = 0;
        
        while(i < parts.length) {
            let matched = false;
            // Try to find longest matching prefix starting at i
            for(let j = parts.length; j > i; j--) {
                const candidate = parts.slice(i, j).join('_');
                // Check if this candidate is a valid option value
                if (options.some(o => o.value === candidate)) {
                    result.push(candidate);
                    i = j;
                    matched = true;
                    break;
                }
            }
            // If no match found for any length starting at i, skip this part
            if (!matched) {
                // Should we treat single part as value? 
                // If the data is corrupted or has unknown tags, maybe ignore or add raw?
                // Let's add it raw if the single part is meaningful, but for now just skip to next
                i++;
            }
        }
        
        return result.length > 0 ? result : [];
    };

	useEffect(() => {
		if (open && outfit) {
			setFormData({
				title: outfit.title || "",
				imageSource: outfit.source || outfit.image_source || "",
				aesthetic: parseOutfitString(outfit.aesthetic || outfit.aesthetic_vibe, AESTHETIC_VIBE_OPTIONS),
				occasion: parseOutfitString(outfit.occasion, OCCASION_OPTIONS),
				formality: parseOutfitString(outfit.formality, FORMALITY_OPTIONS),
				season: parseOutfitString(outfit.season, SEASON_OPTIONS),
				mainColor: parseOutfitString(outfit.color_palette || outfit.colors, COLOR_PALETTE_OPTIONS),
				material: parseOutfitString(outfit.main_material || outfit.material, MATERIAL_OPTIONS),
				pattern: parseOutfitString(outfit.pattern, PATTERN_OPTIONS),
				fit: parseOutfitString(outfit.fit_silhouette || outfit.fit, FIT_OPTIONS),
				layerCount: mapStringToArray(outfit.layering_depth || outfit.layerCount),
			});

			const loadedComponents = parseOutfitString(outfit.category_composition || outfit.components, CATEGORY_OPTIONS);
            // If category_composition is stored as "item1_item2", split it
            // If it is stored as array, use it.
			setMainComponents(loadedComponents);

			if (outfit.items && Array.isArray(outfit.items)) {
                // Map from {url, label, type} to {name, link}
                const mappedLinks = outfit.items.map((item: any) => ({
                    name: item.label || "",
                    link: item.url || ""
                }));
				setProductLinks(mappedLinks.length > 0 ? mappedLinks : [{ name: "", link: "" }]);
			} else if (outfit.product_links && Array.isArray(outfit.product_links)) {
                setProductLinks(outfit.product_links);
            } else {
				setProductLinks([{ name: "", link: "" }]);
			}
		}
	}, [open, outfit]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleMultiSelectChange = (name: string, value: string[]) => {
		setFormData({ ...formData, [name]: value });
	};

	const handleComponentChange = (item: string) => {
		setMainComponents((prev) =>
			prev.includes(item)
				? prev.filter((i) => i !== item)
				: [...prev, item]
		);
	};

	const addProductLink = () => {
		setProductLinks([...productLinks, { name: "", link: "" }]);
	};

	const updateProductLink = (
		index: number,
		field: "name" | "link",
		value: string
	) => {
		const newLinks = [...productLinks];
		newLinks[index][field] = value;
		setProductLinks(newLinks);
	};

	const removeProductLink = (index: number) => {
		if (productLinks.length === 1) {
			setProductLinks([{ name: "", link: "" }]);
			return;
		}
		setProductLinks(productLinks.filter((_, i) => i !== index));
	};

	const handleSubmit = async () => {
		if (!formData.title) {
			toast.error("Vui lòng nhập tiêu đề.");
			return;
		}

		setIsSubmitting(true);
		try {
			const validProductLinks = productLinks.filter(
				(l) => l.name.trim() !== "" || l.link.trim() !== ""
			);

            // Prepare update data
            // Note: We are saving arrays as underscore joined strings for some fields based on CreateOutfitPage logic
            // formatting: formality, pattern, occasion, aesthetic, material, fit, color, season
			const updateData: any = {
				title: formData.title,
				image_source: formData.imageSource,
				aesthetic_vibe: formData.aesthetic.join("_"), // or array? Create page joins with "_"
                occasion: formData.occasion.join("_"),
                formality: formData.formality.join("_"),
                season: formData.season.join("_"),
                main_material: formData.material.join("_"),
                pattern: formData.pattern.join("_"),
				product_links: validProductLinks,
                color_palette: formData.mainColor.join("_"),
                fit_silhouette: formData.fit.join("_"),
                layering_depth: formData.layerCount.length > 0 ? formData.layerCount[0] : "one_layer",
                category_composition: mainComponents, // is this array or string? Create page passes array directly: `category_composition: mainComponents` (array of strings)
				updated_date: serverTimestamp(),
			};
            
            // Note: In Create page:
            // formality, pattern: .join("_")
            // aesthetic_vibe: .join("_")
            // occasion: .join("_")
            // main_material: .join("_")
            // fit_silhouette: .join("_")
            // color_palette: .join("_")
            // season: .join("_")
            // For category_composition it passed the array directly.

			await updateDoc(
				doc(db, process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!, outfit.id),
				updateData
			);

			toast.success("Outfit updated successfully!");
			setOpen(false);
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Error updating outfit:", error);
			toast.error("Failed to update outfit");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
			<DialogContent className="max-h-[90vh] flex flex-col sm:max-w-[900px] p-0 gap-0">
				<DialogHeader className="p-6 pb-2">
					<DialogTitle>Edit Outfit</DialogTitle>
					<DialogDescription>
						Make changes to the outfit details here. Return to save.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6 p-6 overflow-y-auto" ref={setContainer}>
					{/* Basic Info */}
					<div className="space-y-4 rounded-lg border p-4">
						<h3 className="font-semibold">Basic Info</h3>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									name="title"
									value={formData.title}
									onChange={handleChange}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="imageSource">Image Source</Label>
								<Input
									id="imageSource"
									name="imageSource"
									value={formData.imageSource}
									onChange={handleChange}
								/>
							</div>
						</div>
					</div>

					{/* Attributes */}
					<div className="space-y-4 rounded-lg border p-4">
						<h3 className="font-semibold">Attributes</h3>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Aesthetic / Vibe</Label>
								<MultiSelectCombobox
									options={AESTHETIC_VIBE_OPTIONS}
									value={formData.aesthetic}
									onChange={(v) => handleMultiSelectChange("aesthetic", v)}
									placeholder="Select Aesthetic"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Occasion</Label>
								<MultiSelectCombobox
									options={OCCASION_OPTIONS}
									value={formData.occasion}
									onChange={(v) => handleMultiSelectChange("occasion", v)}
									placeholder="Select Occasion"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Formality</Label>
								<MultiSelectCombobox
									options={FORMALITY_OPTIONS}
									value={formData.formality}
									onChange={(v) => handleMultiSelectChange("formality", v)}
									placeholder="Select Formality"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Season</Label>
								<MultiSelectCombobox
									options={SEASON_OPTIONS}
									value={formData.season}
									onChange={(v) => handleMultiSelectChange("season", v)}
									placeholder="Select Season"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Main Color</Label>
								<MultiSelectCombobox
									options={COLOR_PALETTE_OPTIONS}
									value={formData.mainColor}
									onChange={(v) => handleMultiSelectChange("mainColor", v)}
									placeholder="Select Color"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Material</Label>
								<MultiSelectCombobox
									options={MATERIAL_OPTIONS}
									value={formData.material}
									onChange={(v) => handleMultiSelectChange("material", v)}
									placeholder="Select Material"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Pattern</Label>
								<MultiSelectCombobox
									options={PATTERN_OPTIONS}
									value={formData.pattern}
									onChange={(v) => handleMultiSelectChange("pattern", v)}
									placeholder="Select Pattern"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Fit</Label>
								<MultiSelectCombobox
									options={FIT_OPTIONS}
									value={formData.fit}
									onChange={(v) => handleMultiSelectChange("fit", v)}
									placeholder="Select Fit"
                                    container={container}
								/>
							</div>
							<div className="space-y-2">
								<Label>Layer Count</Label>
								<MultiSelectCombobox
									options={LAYERING_OPTIONS}
									value={formData.layerCount}
									onChange={(v) => handleMultiSelectChange("layerCount", v)}
									placeholder="Select Layers"
                                    container={container}
								/>
							</div>
						</div>
					</div>

					{/* Components */}
					<div className="space-y-4 rounded-lg border p-4">
						<h3 className="font-semibold">Main Components</h3>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
							{CATEGORY_OPTIONS.map((item) => (
								<label
									key={item.value}
									className={cn(
										"flex cursor-pointer items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-accent",
										mainComponents.includes(item.value) &&
											"border-primary bg-accent/50"
									)}
								>
									<Checkbox
										checked={mainComponents.includes(item.value)}
										onCheckedChange={() => handleComponentChange(item.value)}
									/>
									<span className="text-sm">{item.label}</span>
								</label>
							))}
						</div>
					</div>

					{/* Product Links */}
					<div className="space-y-4 rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold">Product Links</h3>
							<Button size="sm" variant="outline" onClick={addProductLink}>
								<Plus className="mr-2 h-4 w-4" /> Add Link
							</Button>
						</div>
						<div className="space-y-4">
							{productLinks.map((link, index) => (
								<div key={index} className="flex gap-4 items-end">
									<div className="grid gap-2 flex-1">
										{index === 0 && <Label>Product Name</Label>}
										<Input
											placeholder="Name"
											value={link.name}
											onChange={(e) =>
												updateProductLink(index, "name", e.target.value)
											}
										/>
									</div>
									<div className="grid gap-2 flex-1">
										{index === 0 && <Label>Link</Label>}
										<Input
											placeholder="URL"
											value={link.link}
											onChange={(e) =>
												updateProductLink(index, "link", e.target.value)
											}
										/>
									</div>
									<div className="flex gap-1 pb-1">
										<Button
											size="icon"
											variant="destructive"
											onClick={() => removeProductLink(index)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter className="p-6 pt-2">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
