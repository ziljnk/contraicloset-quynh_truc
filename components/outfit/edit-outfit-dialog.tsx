"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AESTHETIC_VIBE_OPTIONS,
    OCCASION_OPTIONS,
    SEASON_OPTIONS,
} from "@/constant/outfit-options";
import { Plus, Trash2 } from "lucide-react";

interface EditOutfitDialogProps {
    outfit: any;
    children: React.ReactNode;
}

export function EditOutfitDialog({ outfit, children }: EditOutfitDialogProps) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // Form state
    const [title, setTitle] = React.useState(outfit.title || "");
    const [description, setDescription] = React.useState(outfit.description || "");
    const [image, setImage] = React.useState(outfit.images?.[0] || "");
    const [source, setSource] = React.useState(outfit.source || "");
    const [aesthetic, setAesthetic] = React.useState(outfit.aesthetic || "");
    const [occasion, setOccasion] = React.useState(outfit.occasion || "");
    const [season, setSeason] = React.useState(outfit.season || "");
    const [items, setItems] = React.useState<any[]>(outfit.items || []);

    // Update state when outfit changes (in case of re-fetch or prop update)
    React.useEffect(() => {
        if (open) {
            setTitle(outfit.title || "");
            setDescription(outfit.description || "");
            setImage(outfit.images?.[0] || "");
            setSource(outfit.source || "");
            setAesthetic(outfit.aesthetic || "");
            setOccasion(outfit.occasion || "");
            setSeason(outfit.season || "");
            setItems(outfit.items || []);
        }
    }, [outfit, open]);


    const handleSave = async () => {
        setLoading(true);
        try {
            const docRef = doc(
                db,
                process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!,
                outfit.id
            );

            const product_links = items.map(item => ({
                link: item.url,
                name: item.label
            }));

            const updateData: any = {
                title,
                images: [image],
                image_source: source,
                aesthetic,
                occasion,
                season,
                product_links
            };

            if (description) {
                updateData.description = description;
            }

            await updateDoc(docRef, updateData);
            
            setOpen(false);
            window.location.reload(); 

        } catch (error) {
            console.error("Error updating outfit:", error);
            // You might want to use a toast here
            alert("Failed to update outfit");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { label: "", url: "", type: "Sản phẩm" }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b shrink-0">
                    <DialogTitle>Chỉnh sửa outfit</DialogTitle>
                    <DialogDescription>
                         Make changes to the outfit details here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 p-6 overflow-y-auto flex-1">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Tiêu đề</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image">URL ảnh chính</Label>
                        <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="source">Nguồn ảnh</Label>
                        <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Thuộc tính:</Label>
                        
                         <div className="grid gap-2">
                            <Label className="text-sm text-muted-foreground">Aesthetic vibe</Label>
                            <Select value={aesthetic} onValueChange={setAesthetic}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vibe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AESTHETIC_VIBE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                         <div className="grid gap-2">
                            <Label className="text-sm text-muted-foreground">Dịp sử dụng</Label>
                            <Select value={occasion} onValueChange={setOccasion}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn dịp" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OCCASION_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                         <div className="grid gap-2">
                            <Label className="text-sm text-muted-foreground">Mùa</Label>
                            <Select value={season} onValueChange={setSeason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn mùa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEASON_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                         <Label>Đường link sản phẩm:</Label>
                         {items.map((item, index) => (
                             <div key={index} className="flex gap-2 items-start p-2 rounded-md border bg-muted/20">
                                 <div className="grid gap-2 flex-1">
                                    <div className="flex gap-2 items-center">
                                         <Label className="w-10">Tên:</Label>
                                         <Input 
                                            placeholder="Ví dụ: Áo" 
                                            value={item.label} 
                                            onChange={(e) => handleItemChange(index, 'label', e.target.value)} 
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                         <Label className="w-10">URL:</Label>
                                         <Input 
                                            placeholder="https://..." 
                                            value={item.url} 
                                            onChange={(e) => handleItemChange(index, 'url', e.target.value)} 
                                        />
                                    </div>
                                 </div>
                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive h-[88px] w-8">
                                     <Trash2 className="h-4 w-4" />
                                 </Button>
                             </div>
                         ))}
                         <Button variant="ghost" className="w-fit text-primary flex items-center gap-2 hover:bg-primary/10" onClick={handleAddItem}>
                             <Plus className="h-4 w-4" /> Thêm link
                         </Button>
                    </div>

                </div>

                <DialogFooter className="p-6 border-t shrink-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
