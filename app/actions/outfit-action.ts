"use server";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/utils/r2";

const bucketName = process.env.R2_BUCKET_NAME!;

export async function deleteImagesFromR2(imageUrls: string[]) {
    try {
        const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname : "";

        const deletePromises = imageUrls.map(async (url) => {
            try {
                // Extract file name from URL
                const urlObj = new URL(url);

                if (r2PublicDomain && urlObj.hostname !== r2PublicDomain) {
                    console.warn(`URL does not match R2 domain, skipping R2 deletion: ${url}`);
                    return;
                }

                // urlObj.pathname is like "/outfitId/image.webp". Remove the leading slash.
                const key = decodeURIComponent(urlObj.pathname.slice(1));

                if (!key) {
                    console.warn(`Could not extract key from URL: ${url}`);
                    return;
                }

                console.log(`Deleting image with key: ${key}`);

                const command = new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                });

                await r2.send(command);
            } catch (err) {
                console.error(`Failed to parse or delete image: ${url}`, err);
            }
        });

        await Promise.all(deletePromises);
        return { success: true };
    } catch (error) {
        console.error("Error deleting images from R2:", error);
        return { success: false, error: "Failed to delete images" };
    }
}
