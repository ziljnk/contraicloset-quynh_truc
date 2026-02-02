"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	ArrowLeft,
	Image as ImageIcon,
	Loader2,
	Plus,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadIcon, UploadIconHandle } from "@/components/animated-icons/upload";
import { useIconAnimation } from "@/hooks/use-icon-animation";
import ImageUploadPreview from "@/components/custom/image-upload-preview";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";

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
	CATEGORY_OPTIONS
} from "@/constant/outfit-options";

export default function CreateOutfitPage() {
	const router = useRouter();
	const { user, loading, isAdmin } = useAuth();
	const [ isSubmitting, setIsSubmitting ] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const uploadIcon = useIconAnimation<UploadIconHandle>();

	const [ formData, setFormData ] = useState({
		title: "",
		description: "", // Added description field for user
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

	const [ mainComponents, setMainComponents ] = useState<string[]>([]);
	const [ productLinks, setProductLinks ] = useState<
		{ name: string; link: string }[]
	>([ { name: "", link: "" } ]);
	const [ imageFiles, setImageFiles ] = useState<File[]>([]);
	const [ previewUrls, setPreviewUrls ] = useState<string[]>([]);

	// Protect route - require login
	useEffect(() => {
		if (!loading && !user) {
			toast.error("Vui lòng đăng nhập để tạo outfit");
			router.push("/login"); // or wherever the login page is
		}
	}, [ loading, user, router ]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData({ ...formData, [ e.target.name ]: e.target.value });
	};

	const handleMultiSelectChange = (name: string, value: string[]) => {
		setFormData({ ...formData, [ name ]: value });
	};

	const handleComponentChange = (item: string) => {
		setMainComponents((prev) =>
			prev.includes(item) ?
				prev.filter((i) => i !== item)
				: [ ...prev, item ],
		);
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			// Limit to 10 images total
			if (imageFiles.length + files.length > 10) {
				toast.error("Tối đa 10 ảnh cho mỗi set đồ");
				return;
			}

			// Filter size < 10MB
			const validFiles = files.filter(
				(file) => file.size <= 10 * 1024 * 1024,
			);
			if (validFiles.length < files.length) {
				toast.warning("Một số ảnh bị bỏ qua do vượt quá 10MB");
			}

			setImageFiles((prev) => [ ...prev, ...validFiles ]);
			const newPreviews = validFiles.map((file) =>
				URL.createObjectURL(file),
			);
			setPreviewUrls((prev) => [ ...prev, ...newPreviews ]);
		}
	};

	const addProductLink = () => {
		setProductLinks([ ...productLinks, { name: "", link: "" } ]);
	};

	const updateProductLink = (
		index: number,
		field: "name" | "link",
		value: string,
	) => {
		const newLinks = [ ...productLinks ];
		newLinks[ index ][ field ] = value;
		setProductLinks(newLinks);
	};

	const removeProductLink = (index: number) => {
		// If it's the only one, clear it instead of removing
		if (productLinks.length === 1) {
			setProductLinks([ { name: "", link: "" } ]);
			return;
		}
		setProductLinks(productLinks.filter((_, i) => i !== index));
	};

	const handleSubmit = async () => {
		if (imageFiles.length === 0) {
			toast.error("Vui lòng tải lên ít nhất một ảnh.");
			return;
		}
		if (!formData.title) {
			toast.error("Vui lòng nhập tiêu đề.");
			return;
		}

		setIsSubmitting(true);

		try {
			// 1. Upload Images using API Route
			const uploadData = new FormData();
			// Sanitize filenames to prevent "string did not match expected pattern" error
			// which can happen when filenames contain special characters/unicode
			imageFiles.forEach((file, index) => {
				const extension = file.name.split('.').pop() || "jpg";
				const safeName = `image_${Date.now()}_${index}.${extension}`;
				uploadData.append("files", file, safeName);
			});

			let imageUrls: string[] = [];
			
			try {
				const response = await fetch("/api/upload", {
					method: "POST",
					body: uploadData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Lỗi khi tải ảnh lên");
				}

				const data = await response.json();
				imageUrls = data.urls;
			} catch (err: any) {
				console.error("Upload Error:", err);
				throw new Error("Lỗi upload ảnh: " + (err.message || "Unknown error"));
			}

			// Filter out empty product links
			const validProductLinks = productLinks.filter(
				(l) => l.name.trim() !== "" || l.link.trim() !== "",
			).map(l => ({ name: l.name || "", link: l.link || "" }));

            // 2. Prepare Data for pending_outfits (User Logic)
			// Ensure no undefined values are passed to Firestore
			const outfitData = {
			    userId: user?.uid || "",
			    userEmail: user?.email || "",
			    createdByName: user?.displayName || user?.email || "Anonymous", 
			    
				formality: formData.formality || [], 
				pattern: formData.pattern || [],
				layering: formData.layerCount || [], 
				productLinks: validProductLinks,
				imageSource: formData.imageSource || "",
				occasion: formData.occasion || [],
				material: formData.material || [],
				fit: formData.fit || [],
				aesthetic: formData.aesthetic || [],
				colors: formData.mainColor || [], 
				season: formData.season || [],
				categories: mainComponents || [],
				
				title: formData.title || "",
				description: formData.description || "",
				
				images: imageUrls,
				imageUrl: imageUrls[0] || "",
				
				status: "pending",
				createdAt: serverTimestamp(),
			};

			// 3. Add to pending_outfits
			const docRef = await addDoc(collection(db, "pending_outfits"), outfitData);
			const pendingOutfitId = docRef.id;

            // 4. Add Notification to reports collection
            const reportData = {
                createdAt: serverTimestamp(),
                details: `Outfit mới đang chờ duyệt từ ${user?.email || "Unknown"}`,
                isRead: false,
                outfitId: pendingOutfitId,
                outfitTitle: formData.title || "",
                reasons: ["pending_outfit"],
                type: "pending_outfit",
                userEmail: user?.email || ""
            };
            
            await addDoc(collection(db, "reports"), reportData);

			toast.success("Đã gửi outfit để chờ duyệt!");
			
			// Reset form
			setFormData({
				title: "",
				description: "",
				imageSource: "",
				aesthetic: [],
				occasion: [],
				formality: [],
				season: [],
				mainColor: [],
				material: [],
				pattern: [],
				fit: [],
				layerCount: [],
			});
			setMainComponents([]);
			setProductLinks([ { name: "", link: "" } ]);
			setImageFiles([]);
			setPreviewUrls([]);
            
			router.push("/");
		} catch (error) {
			console.error("Error creating outfit:", error);
			toast.error("Failed to create outfit: " + (error instanceof Error ? error.message : "Unknown error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-6xl p-4 py-8 pb-32">
			{/* Header */ }
			<div className="mb-6">
				<Button
					variant="outline"
                    className="pl-0 hover:pl-2 transition-all mb-4"
					onClick={ () => router.back() }
				>
					<ArrowLeft className="h-4 w-4" />
					Quay lại
				</Button>
				<h1 className="text-2xl font-bold text-[#382c25]">
					Tạo outfit mới
				</h1>
				<p className="text-sm text-muted-foreground">
					Chia sẻ outfit của bạn với cộng đồng (sẽ được admin xem xét và duyệt)
				</p>
			</div>

			{/* Upload Image */ }
			<div className="mb-8 rounded-lg bg-card md:p-0">
				<h2 className="mb-4 font-semibold text-[#382c25]">
					Ảnh set đồ *
				</h2>

				{/* Preview Area */ }
				<ImageUploadPreview
					files={ imageFiles }
					previewUrls={ previewUrls }
					setFiles={ setImageFiles }
					setPreviewUrls={ setPreviewUrls }
				/>

				<div
					{ ...uploadIcon.events }
					onClick={ () => fileInputRef.current?.click() }
					className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50"
				>
					<input
						type="file"
						accept="image/*"
						multiple
						className="hidden"
						ref={ fileInputRef }
						onChange={ handleImageChange }
					/>
					<div className="mb-4 rounded-full bg-white p-4 shadow-sm dark:bg-gray-800">
						<ImageIcon className="h-8 w-8 text-gray-400" />
					</div>
					<h3 className="mb-1 font-semibold text-[#382c25]">
						Tải ảnh set đồ
					</h3>
					<p className="mb-6 text-sm text-muted-foreground">
						Kéo & thả hoặc nhấp để chọn tệp ({ imageFiles.length }/10)
					</p>
					<Button
						variant="outline"
						className="bg-white"
						type="button"
					>
						<UploadIcon ref={ uploadIcon.ref } className="mr-2" /> Chọn tệp
					</Button>
				</div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
					<p>• Định dạng hỗ trợ: JPG, PNG, WebP</p>
					<p>• Dung lượng tối đa: 10MB mỗi ảnh</p>
					<p>• Kích thước tối thiểu: 1KB mỗi ảnh</p>
					<p>• Tối đa 10 ảnh cho mỗi set đồ</p>
					<p>• Ảnh đầu tiên sẽ được dùng làm ảnh bìa chính</p>
					<p>• Hệ thống tự động resize ảnh &gt; 5MB để tối ưu</p>
				</div>
			</div>

			{/* Basic Info */ }
			<div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
				<h2 className="mb-4 text-lg font-semibold text-[#382c25]">
					Thông tin cơ bản
				</h2>
				<div className="space-y-6">
					<div className="space-y-2">
						<label className="text-sm font-medium text-[#382c25]">
							Tiêu đề *
						</label>
						<Input
							name="title"
							value={ formData.title }
							onChange={ handleChange }
							placeholder="Đặt tiêu đề hấp dẫn cho set đồ của bạn..."
							className="bg-white"
						/>
					</div>
                     {/* Description Field (Added for User) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#382c25]">
                            Mô tả
                        </label>
                        <Textarea
                            name="description"
                            value={ formData.description }
                            onChange={ handleChange }
                            placeholder="Mô tả chi tiết về outfit..."
                            className="bg-white"
                        />
                    </div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-[#382c25]">
							Nguồn ảnh (Link)
						</label>
						<Input
							name="imageSource"
							value={ formData.imageSource }
							onChange={ handleChange }
							placeholder="https://..."
							className="bg-white"
						/>
					</div>
				</div>
			</div>

			{/* Attributes */ }
			{ isAdmin && (
				<div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
					<h2 className="mb-4 text-lg font-semibold text-[#382c25]">
						Thuộc tính set đồ
					</h2>
				<div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
					{/* 1. Aesthetic */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							1. Aesthetic / Vibe
						</label>
						<MultiSelectCombobox
							options={ AESTHETIC_VIBE_OPTIONS }
							value={ formData.aesthetic }
							onChange={ (v) => handleMultiSelectChange("aesthetic", v) }
							placeholder="Chọn Aesthetic / Vibe"
						/>
					</div>
					{/* 2. Occasion */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							2. Dịp sử dụng
						</label>
						<MultiSelectCombobox
							options={ OCCASION_OPTIONS }
							value={ formData.occasion }
							onChange={ (v) => handleMultiSelectChange("occasion", v) }
							placeholder="Chọn Dịp sử dụng"
						/>
					</div>
					{/* 3. Formality */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							3. Mức độ trang trọng
						</label>
						<MultiSelectCombobox
							options={ FORMALITY_OPTIONS }
							value={ formData.formality }
							onChange={ (v) => handleMultiSelectChange("formality", v) }
							placeholder="Chọn Mức độ trang trọng"
						/>
					</div>
					{/* 4. Season */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							4. Mùa / Khí hậu
						</label>
						<MultiSelectCombobox
							options={ SEASON_OPTIONS }
							value={ formData.season }
							onChange={ (v) => handleMultiSelectChange("season", v) }
							placeholder="Chọn Mùa / Khí hậu"
						/>
					</div>
					{/* 5. Main Color */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							5. Màu chủ đạo
						</label>
						<MultiSelectCombobox
							options={ COLOR_PALETTE_OPTIONS }
							value={ formData.mainColor }
							onChange={ (v) => handleMultiSelectChange("mainColor", v) }
							placeholder="Chọn Màu chủ đạo"
						/>
					</div>
					{/* 6. Material */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							6. Chất liệu chính
						</label>
						<MultiSelectCombobox
							options={ MATERIAL_OPTIONS }
							value={ formData.material }
							onChange={ (v) => handleMultiSelectChange("material", v) }
							placeholder="Chọn Chất liệu chính"
						/>
					</div>
					{/* 7. Pattern */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							7. Họa tiết
						</label>
						<MultiSelectCombobox
							options={ PATTERN_OPTIONS }
							value={ formData.pattern }
							onChange={ (v) => handleMultiSelectChange("pattern", v) }
							placeholder="Chọn Họa tiết"
						/>
					</div>
					{/* 8. Fit */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							8. Fit / Silhouette
						</label>
						<MultiSelectCombobox
							options={ FIT_OPTIONS }
							value={ formData.fit }
							onChange={ (v) => handleMultiSelectChange("fit", v) }
							placeholder="Chọn Fit / Silhouette"
						/>
					</div>
					{/* 9. Layers */ }
					<div className="space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							9. Số lớp phối
						</label>
						<MultiSelectCombobox
							options={ LAYERING_OPTIONS }
							value={ formData.layerCount }
							onChange={ (v) => handleMultiSelectChange("layerCount", v) }
							placeholder="Chọn Số lớp phối"
						/>
					</div>
				</div>

				{/* 10. Components */ }
				<div className="mt-8 space-y-4">
					<label className="block text-sm font-medium text-[#382c25]">
						10. Thành phần chính (có thể chọn nhiều)
					</label>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4">
						{ CATEGORY_OPTIONS.map((item) => (
							<label
								key={ item.label }
								className={ cn(
									"flex cursor-pointer items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-accent",
									mainComponents.includes(item.label) &&
									"border-[#382c25] bg-accent/50",
								) }
							>
								<Checkbox
									checked={ mainComponents.includes(item.label) }
									onCheckedChange={ () => handleComponentChange(item.label) }
								/>
								<span className="text-sm text-gray-700">
									{ item.label }
								</span>
							</label>
						)) }
					</div>
				</div>
			</div>
			) }

			{/* Product Links */ }
			<div className="mb-20 rounded-lg border bg-white p-6 shadow-sm">
				<h2 className="mb-4 flex items-center text-lg font-semibold text-[#382c25]">
					<span className="mr-2">🏷️</span> Liên kết sản phẩm
				</h2>
				<div className="space-y-4">
					{ productLinks.map((link, index) => (
						<div
							key={ index }
							className="grid gap-4 md:grid-cols-[1fr,1fr,auto]"
						>
							<div className="space-y-2">
								{ index === 0 && (
									<label className="text-sm font-medium text-muted-foreground">
										Tên sản phẩm
									</label>
								) }
								<Input
									placeholder="Ví dụ: Áo, Quần, Giày..."
									value={ link.name }
									onChange={ (e) =>
										updateProductLink(
											index,
											"name",
											e.target.value,
										)
									}
									className="bg-white"
								/>
							</div>
							<div className="space-y-2">
								{ index === 0 && (
									<label className="text-sm font-medium text-muted-foreground">
										Link sản phẩm
									</label>
								) }
								<Input
									placeholder="https://..."
									value={ link.link }
									onChange={ (e) =>
										updateProductLink(
											index,
											"link",
											e.target.value,
										)
									}
									className="bg-white"
								/>
							</div>
							<div className={ index === 0 ? "pt-8" : "" }>
								<div className="flex gap-1">
									{ index === productLinks.length - 1 && (
										<Button
											size="icon"
											className="h-10 w-10 bg-[#382c25] hover:bg-[#382c25]/90"
											onClick={ addProductLink }
											type="button"
										>
											<Plus className="h-5 w-5" />
										</Button>
									) }
									{ productLinks.length > 1 && (
										<Button
											size="icon"
											variant="ghost"
											className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600"
											onClick={ () =>
												removeProductLink(index)
											}
											type="button"
										>
											<Trash2 className="h-5 w-5" />
										</Button>
									) }
								</div>
							</div>
						</div>
					)) }
				</div>
			</div>

			{/* Footer Actions */ }
			<div className="container mx-auto flex justify-end gap-3">
				<Button
					variant="outline"
					className="min-w-[100px] border-gray-200"
					onClick={ () => router.back() }
					type="button"
				>
					Hủy
				</Button>
				<Button
					className="min-w-[150px] bg-[#382c25] text-white hover:bg-[#382c25]/90"
					onClick={ handleSubmit }
					disabled={ isSubmitting }
				>
					{ isSubmitting ?
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />{ " " }
							Vui lòng chờ...
						</>
						: "Gửi chờ duyệt" }
				</Button>
			</div>
		</div>
	);
}
