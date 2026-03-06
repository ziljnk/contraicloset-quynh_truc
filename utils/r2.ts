import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn("Missing R2 credentials. Upload feature may not work.");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId || 'dummy'}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "dummy-access-key",
    secretAccessKey: secretAccessKey || "dummy-secret-key",
  },
});
