import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://2ce26eb6461eee8136e8f288f08323f2.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "3bab56668fe9424661928cad49dd77c7",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "1aeffa788bcbf92af91f83f558c81796109ea9192c62343dcd5b7b81c00beaa5",
  },
});

const BUCKET = process.env.R2_BUCKET || "flowsites-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-6e6682d5b928477ab40c1873a1345ec5.r2.dev";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const folder = req.query.folder === "videos" ? "videos" : "images";
    const filename = req.query.filename || `file-${Date.now()}`;
    const contentType = req.headers["content-type"] || "application/octet-stream";
    const ext = filename.split(".").pop();
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const publicUrl = `${PUBLIC_URL}/${key}`;
    return res.status(200).json({ url: publicUrl, key });
  } catch (err) {
    console.error("R2 upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
}
