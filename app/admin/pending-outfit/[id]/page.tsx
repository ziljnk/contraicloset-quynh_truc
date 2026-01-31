"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/utils/firebase";
import {
	collection,
	doc,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	serverTimestamp,
	getDocs,
	query,
	where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Plus, Trash2, Tag, Pencil } from "lucide-react";
import { toast } from "sonner";
import { MultiSelectCombobox } from "@/components/custom/multi-select-combobox";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

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

export default function PendingOutfitPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	// Unwrap params
	const { id } = use(params);

	const router = useRouter();
	const searchParams = useSearchParams();
	const reportId = searchParams.get("reportId");
	const { user, loading, isAdmin } = useAuth();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [fetchedStarted, setFetchStarted] = useState(false);

	const [formData, setFormData] = useState({
		title: "",
		description: "",
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
	const [newLink, setNewLink] = useState({ name: "", link: "" });
	const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(
		null,
	);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [userData, setUserData] = useState<any>(null);

	// Protect the route
	useEffect(() => {
		if (!loading && !isAdmin) {
			toast.error("You are not authorized to access this page.");
			router.push("/");
		}
	}, [loading, isAdmin, router]);

	// Helper to safely parse array or string
	const safeSplit = (val: any) => {
		if (Array.isArray(val)) return val;
		if (typeof val === "string") return val.split("_");
		return [];
	};

	// Helper to map labels (from Pending) to values (for Options)
	const mapLabelsToValues = (
		dataValues: any,
		options: { label: string; value: string }[],
	) => {
		const normalized = safeSplit(dataValues);
		return normalized.map((item: string) => {
			// Check if item is already a value
			const isValue = options.some((opt) => opt.value === item);
			if (isValue) return item;

			// Check if item is a label
			const found = options.find((opt) => opt.label === item);
			return found ? found.value : item; // return item if no match found (fallback)
		});
	};

	// Fetch Data
	useEffect(() => {
		if (loading || !isAdmin || !id || fetchedStarted) return;

		const fetchData = async () => {
			setFetchStarted(true);
			try {
				const docRef = doc(db, "pending_outfits", id);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const data = docSnap.data();
					console.log("data", data);
					setUserData({
						userId: data.userId,
						userEmail: data.userEmail,
						createdAt: data.createdAt,
					});

					// Populate form
					setFormData({
						title: data.title || "",
						description: data.description || "",
						imageSource:
							data.imageSource || data.image_source || "",
						aesthetic: mapLabelsToValues(
							data.aesthetic || data.aesthetic_vibe,
							AESTHETIC_VIBE_OPTIONS,
						),
						occasion: mapLabelsToValues(
							data.occasion,
							OCCASION_OPTIONS,
						),
						formality: mapLabelsToValues(
							data.formality,
							FORMALITY_OPTIONS,
						),
						season: mapLabelsToValues(data.season, SEASON_OPTIONS),
						mainColor: mapLabelsToValues(
							data.colors || data.color_palette,
							COLOR_PALETTE_OPTIONS,
						),
						material: mapLabelsToValues(
							data.material || data.main_material,
							MATERIAL_OPTIONS,
						),
						pattern: mapLabelsToValues(
							data.pattern,
							PATTERN_OPTIONS,
						),
						fit: mapLabelsToValues(
							data.fit || data.fit_silhouette,
							FIT_OPTIONS,
						),
						layerCount: mapLabelsToValues(
							data.layering ||
								data.layering_depth ||
								(data.layering_depth ?
									[data.layering_depth]
								:	[]),
							LAYERING_OPTIONS,
						),
					});

					const productLinksData =
						data.productLinks || data.product_links;
					if (productLinksData && Array.isArray(productLinksData)) {
						setProductLinks(productLinksData);
					}

					const categoriesData =
						data.categories || data.category_composition;
					if (categoriesData && Array.isArray(categoriesData)) {
						// Map category labels to values if needed
						setMainComponents(
							mapLabelsToValues(categoriesData, CATEGORY_OPTIONS),
						);
					}

					const imagesData = data.images;
					if (imagesData && Array.isArray(imagesData)) {
						setImageUrls(imagesData);
					} else if (data.imageUrl) {
						setImageUrls([data.imageUrl]);
					}
				} else {
					toast.error("Pending outfit not found");
					router.push("/admin/analytics"); // redirect somewhere safe
				}
			} catch (error) {
				console.error("Error fetching outfit:", error);
				toast.error("Failed to load outfit details");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [id, loading, isAdmin, router, fetchedStarted]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleMultiSelectChange = (name: string, value: string[]) => {
		setFormData({ ...formData, [name]: value });
	};

	const handleComponentChange = (item: string) => {
		setMainComponents((prev) =>
			prev.includes(item) ?
				prev.filter((i) => i !== item)
			:	[...prev, item],
		);
	};

	// Shop Link Handlers
	const handleAddLink = () => {
		if (!newLink.name.trim() && !newLink.link.trim()) return;

		if (editingLinkIndex !== null) {
			const updated = [...productLinks];
			updated[editingLinkIndex] = newLink;
			setProductLinks(updated);
			setEditingLinkIndex(null);
		} else {
			setProductLinks([...productLinks, newLink]);
		}
		setNewLink({ name: "", link: "" });
	};

	const handleEditLink = (index: number) => {
		setNewLink(productLinks[index]);
		setEditingLinkIndex(index);
	};

	const handleRemoveLink = (index: number) => {
		setProductLinks(productLinks.filter((_, i) => i !== index));
		if (editingLinkIndex === index) {
			setEditingLinkIndex(null);
			setNewLink({ name: "", link: "" });
		}
	};

	const cleanupReport = async () => {
		if (!reportId) {
			// Try to find report if not passed in URL
			const q = query(
				collection(db, "reports"),
				where("outfitId", "==", id),
			);
			const snapshot = await getDocs(q);
			snapshot.forEach(async (d) => {
				await deleteDoc(doc(db, "reports", d.id));
			});
			return;
		}

		try {
			await deleteDoc(doc(db, "reports", reportId));
		} catch (error) {
			console.error("Error deleting report:", error);
		}
	};

	const handleApprove = async () => {
		if (!formData.title) {
			toast.error("Vui lòng nhập tiêu đề.");
			return;
		}

		setIsSubmitting(true);
		try {
			const validProductLinks = productLinks.filter(
				(l) => l.name.trim() !== "" || l.link.trim() !== "",
			);

			const outfitData = {
				...formData, // basic strings like title, imageSource
				formality: formData.formality.join("_") || "casual",
				pattern: formData.pattern.join("_") || "solid",
				layering_depth:
					formData.layerCount.length > 0 ?
						formData.layerCount[0]
					:	"one_layer",
				product_links: validProductLinks,
				isSaved: true,
				image_source: formData.imageSource,
				occasion: formData.occasion.join("_") || "daily",
				updated_date: serverTimestamp(),
				main_material: formData.material.join("_") || "cotton",
				fit_silhouette: formData.fit.join("_") || "relaxed_fit",
				aesthetic_vibe: formData.aesthetic.join("_") || "streetwear",
				id: formData.title, // or generate ID
				images: imageUrls,
				saved_by: [], // pending outfit doesn't carry over saved_by usually, or maybe from user?
				// preserving original user info?
				original_user_id: userData?.userId || null,
				original_user_email: userData?.userEmail || null,
				created_date: serverTimestamp(),
				title: formData.title,
				description: formData.description,
				color_palette: formData.mainColor.join("_") || "black_grey",
				season: formData.season.join("_") || "thu",
				category_composition: mainComponents,
			};

			// 1. Add to outfits
			await addDoc(
				collection(
					db,
					process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME ||
						"outfits",
				),
				outfitData,
			);

			// 2. Update pending_outfits status
			await updateDoc(doc(db, "pending_outfits", id), {
				status: "approved",
				approvedAt: serverTimestamp(),
				approvedBy: user?.uid,
			});

			// 3. Delete report
			await cleanupReport();

			toast.success("Duyệt outfit thành công!");
			router.push("/admin/analytics"); // or wherever
		} catch (error) {
			console.error("Error approving outfit:", error);
			toast.error("Có lỗi xảy ra khi duyệt outfit");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		setIsSubmitting(true);
		try {
			// 1. Update pending_outfits status
			await updateDoc(doc(db, "pending_outfits", id), {
				status: "rejected",
				rejectedAt: serverTimestamp(),
				rejectedBy: user?.uid,
			});

			// 2. Delete report
			await cleanupReport();

			toast.success("Đã từ chối outfit.");
			router.push("/admin/analytics");
		} catch (error) {
			console.error("Error rejecting outfit:", error);
			toast.error("Có lỗi xảy ra");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-5xl py-8 pb-32 px-4 space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">Duyệt Outfit Chờ</h1>
						{userData && (
							<p className="text-sm text-muted-foreground">
								Tạo bởi: {userData.userEmail}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Images Section */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Hình ảnh</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{imageUrls.map((url, idx) => (
						<div
							key={idx}
							className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted"
						>
							<img
								src={url}
								alt={`Preview ${idx}`}
								className="object-cover w-full h-full"
							/>
						</div>
					))}
					{imageUrls.length === 0 && (
						<div className="col-span-2 aspect-[3/4] rounded-lg border flex items-center justify-center bg-muted">
							<span className="text-muted-foreground">
								Không có ảnh
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Basic Info */}
			<div className="space-y-4 rounded-xl border p-6 bg-card">
				<h3 className="font-semibold text-lg">Thông tin cơ bản</h3>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Tiêu đề</Label>
						<Input
							id="title"
							name="title"
							value={formData.title}
							onChange={handleChange}
							placeholder="Tên set đồ..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Mô tả</Label>
						<Textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleChange}
							placeholder="Mô tả chi tiết..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="imageSource">Nguồn ảnh</Label>
						<Input
							id="imageSource"
							name="imageSource"
							value={formData.imageSource}
							onChange={handleChange}
							placeholder="Pinterest, Instagram,..."
						/>
					</div>
				</div>
			</div>

			{/* Attributes */}
			<div className="space-y-4 rounded-xl border p-6 bg-card">
				<h3 className="font-semibold text-lg">Thuộc tính set đồ</h3>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-2">
						<Label>1. Aesthetic / Vibe</Label>
						<MultiSelectCombobox
							options={AESTHETIC_VIBE_OPTIONS}
							value={formData.aesthetic}
							onChange={(val) =>
								handleMultiSelectChange("aesthetic", val)
							}
							placeholder="Chọn aesthetic"
						/>
					</div>

					<div className="space-y-2">
						<Label>2. Dịp sử dụng</Label>
						<MultiSelectCombobox
							options={OCCASION_OPTIONS}
							value={formData.occasion}
							onChange={(val) =>
								handleMultiSelectChange("occasion", val)
							}
							placeholder="Chọn Dịp sử dụng"
						/>
					</div>

					<div className="space-y-2">
						<Label>3. Mức độ trang trọng</Label>
						<MultiSelectCombobox
							options={FORMALITY_OPTIONS}
							value={formData.formality}
							onChange={(val) =>
								handleMultiSelectChange("formality", val)
							}
							placeholder="Chọn Mức độ trang trọng"
						/>
					</div>

					<div className="space-y-2">
						<Label>4. Mùa / Khí hậu</Label>
						<MultiSelectCombobox
							options={SEASON_OPTIONS}
							value={formData.season}
							onChange={(val) =>
								handleMultiSelectChange("season", val)
							}
							placeholder="Chọn Mùa / Khí hậu"
						/>
					</div>

					<div className="space-y-2">
						<Label>5. Màu chủ đạo</Label>
						<MultiSelectCombobox
							options={COLOR_PALETTE_OPTIONS}
							value={formData.mainColor}
							onChange={(val) =>
								handleMultiSelectChange("mainColor", val)
							}
							placeholder="Chọn Màu chủ đạo"
						/>
					</div>

					<div className="space-y-2">
						<Label>6. Chất liệu chính</Label>
						<MultiSelectCombobox
							options={MATERIAL_OPTIONS}
							value={formData.material}
							onChange={(val) =>
								handleMultiSelectChange("material", val)
							}
							placeholder="Chọn Chất liệu chính"
						/>
					</div>

					<div className="space-y-2">
						<Label>7. Họa tiết</Label>
						<MultiSelectCombobox
							options={PATTERN_OPTIONS}
							value={formData.pattern}
							onChange={(val) =>
								handleMultiSelectChange("pattern", val)
							}
							placeholder="Chọn Họa tiết"
						/>
					</div>

					<div className="space-y-2">
						<Label>8. Fit / Silhouette</Label>
						<MultiSelectCombobox
							options={FIT_OPTIONS}
							value={formData.fit}
							onChange={(val) =>
								handleMultiSelectChange("fit", val)
							}
							placeholder="Chọn Fit / Silhouette"
						/>
					</div>

					<div className="md:col-span-2 space-y-2">
						<Label>9. Số lớp phối</Label>
						<MultiSelectCombobox
							options={LAYERING_OPTIONS}
							value={formData.layerCount}
							onChange={(val) => {
								handleMultiSelectChange(
									"layerCount",
									val.length > 0 ? [val[val.length - 1]] : [],
								);
							}}
							placeholder="Chọn Số lớp phối"
						/>
					</div>
				</div>

				<div className="mt-6 border-t pt-6">
					<Label className="mb-3 block">
						10. Thành phần chính (có thể chọn nhiều)
					</Label>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
						{CATEGORY_OPTIONS.map((item) => (
							<div
								key={item.value}
								className="flex items-center space-x-2 border rounded-md p-3"
							>
								<Checkbox
									id={item.value}
									checked={mainComponents.includes(
										item.value,
									)}
									onCheckedChange={() =>
										handleComponentChange(item.value)
									}
								/>
								<label
									htmlFor={item.value}
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
								>
									{item.label}
								</label>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Shop Links */}
			<div className="space-y-4 rounded-xl border p-6 bg-card">
				<h3 className="font-semibold text-lg">Nơi mua phối đồ</h3>

				<div className="flex gap-3 items-end">
					<div className="flex-1 space-y-2">
						<Label>Tên sản phẩm</Label>
						<Input
							value={newLink.name}
							onChange={(e) =>
								setNewLink({ ...newLink, name: e.target.value })
							}
							placeholder="Ví dụ: Áo, Quần, Giày..."
						/>
					</div>
					<div className="flex-1 space-y-2">
						<Label>Liên kết tiếp thị</Label>
						<Input
							value={newLink.link}
							onChange={(e) =>
								setNewLink({ ...newLink, link: e.target.value })
							}
							placeholder="https://..."
						/>
					</div>

					<div className="flex gap-1 pb-1">
						<Button
							type="button"
							size="icon"
							onClick={handleAddLink}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{productLinks.length > 0 && (
					<div className="space-y-2 mt-4">
						<Label className="text-sm text-muted-foreground">
							Danh sách liên kết
						</Label>
						<div className="space-y-2">
							{productLinks.map((link, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border group"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
											<Tag className="h-4 w-4" />
										</div>
										<div className="flex flex-col overflow-hidden">
											<span className="font-medium text-sm truncate">
												{link.name}
											</span>
											<a
												href={link.link}
												target="_blank"
												rel="noreferrer"
												className="text-xs text-blue-500 hover:underline truncate"
											>
												{link.link}
											</a>
										</div>
									</div>
									<div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 text-muted-foreground hover:text-foreground"
											onClick={() =>
												handleEditLink(index)
											}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
											onClick={() =>
												handleRemoveLink(index)
											}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Actions - Fixed Bottom */}
			<div className="container mx-auto max-w-5xl flex justify-end gap-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isSubmitting}
                        >
                            Từ chối
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Từ chối outfit này?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hành động này sẽ đánh dấu outfit là "rejected" và xóa báo cáo liên quan. Bạn không thể hoàn tác hành động này.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Xác nhận từ chối
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

				<Button
					onClick={handleApprove}
					disabled={isSubmitting}
				>
					{isSubmitting && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Duyệt & Đăng
				</Button>
			</div>
		</div>
	);
}
