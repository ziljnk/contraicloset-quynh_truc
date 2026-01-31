"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { deleteImagesFromCloudinary } from "@/app/actions/outfit-action";
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

interface DeleteOutfitDialogProps {
  outfitId: string;
  images: string[];
  children: React.ReactNode;
}

export function DeleteOutfitDialog({ outfitId, images, children }: DeleteOutfitDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // 1. Delete images from Cloudinary
      if (images && images.length > 0) {
        await deleteImagesFromCloudinary(images);
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME!, outfitId));

      // 3. Redirect to home/gallery
      router.push("/");
      router.refresh();
      
    } catch (error) {
      console.error("Error deleting outfit:", error);
      alert("Failed to delete outfit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the outfit
            and remove its images from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => {
             e.preventDefault(); 
             handleDelete();
          }} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
