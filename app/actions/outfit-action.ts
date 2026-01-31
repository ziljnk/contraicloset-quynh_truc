"use server";

import cloudinary from "@/utils/cloudinary";

export async function deleteImagesFromCloudinary(imageUrls: string[]) {
    try {
        const deletePromises = imageUrls.map(async (url) => {
            // Extract public_id from URL
            // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
            // public_id: folder/image
            
            try {
                // Split by '/'
                const parts = url.split('/');
                
                // Find index of 'upload'
                const uploadIndex = parts.indexOf('upload');
                
                if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
                    console.warn(`Could not extract public_id from URL: ${url}`);
                    return;
                }

                // The parts after 'upload' and version (v...) are the public_id parts
                // Version usually starts with 'v' and is numbers. 
                // However, sometimes version is omitted or flexible.
                
                // Let's assume standard Cloudinary URL structure where version follows 'upload'
                // and then the public path starts.
                
                const versionIndex = uploadIndex + 1;
                const publicIdParts = parts.slice(versionIndex + 1);
                
                // Join parts and remove extension
                const publicIdWithExtension = publicIdParts.join('/');
                const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");
                
                console.log(`Deleting image with public_id: ${publicId}`);

                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error(`Failed to parse or delete image: ${url}`, err);
            }
        });

        await Promise.all(deletePromises);
        return { success: true };
    } catch (error) {
        console.error("Error deleting images from Cloudinary:", error);
        return { success: false, error: "Failed to delete images" };
    }
}
