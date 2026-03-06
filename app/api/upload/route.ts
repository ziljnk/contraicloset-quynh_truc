import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/utils/r2";
import sharp from "sharp";

const bucketName = process.env.R2_BUCKET_NAME!;
const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

const SIZES = {
    mobile: { width: 480 },
    desktop: { width: 1024 },
};

async function uploadToR2WithRetry(buffer: Buffer, key: string, contentType: string, retries = 3) {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await r2.send(command);
            const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
            return `${publicUrl}/${encodedKey}`;
        } catch (error: any) {
            console.error(`Upload attempt ${attempt} failed for ${key}:`, error.message);
            if (attempt === retries) {
                throw new Error(`Failed to upload ${key} after ${retries} attempts`);
            }
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const outfitId = formData.get("outfitId") as string || `temp_${Date.now()}`;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const uploadPromises = files.map(async (file, index) => {
            const arrayBuffer = await file.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            const encodedOutfitId = encodeURIComponent(outfitId);
            const variantsUrls: Record<string, string> = {};

            // Process and upload for each size
            for (const [sizeName, sizeSpec] of Object.entries(SIZES)) {
                // Resize and convert to WebP
                const resizedBuffer = await sharp(imageBuffer)
                    .resize({ width: sizeSpec.width, withoutEnlargement: true })
                    .webp({ quality: 90 })
                    .toBuffer();

                const key = `${encodedOutfitId}/image_${index + 1}_${sizeName}.webp`;
                
                // Do not URL encode the key here if S3 needs the exact string, 
                // but uploadToR2WithRetry handles encodeURIComponent(key) for the return URL
                const url = await uploadToR2WithRetry(resizedBuffer, key, 'image/webp');
                if (url) {
                    variantsUrls[sizeName] = url;
                }
            }

            return {
                original_url: null, // Assuming you might not store original if migrating, or add if needed
                variants: variantsUrls
            };
        });

        const urls = await Promise.all(uploadPromises);

        return NextResponse.json({ urls });
    } catch (error) {
        console.error("API upload error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}
