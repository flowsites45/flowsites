import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://2ce26eb6461eee8136e8f288f08323f2.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '3bab56668fe9424661928cad49dd77c7',
    secretAccessKey: '1aeffa788bcbf92af91f83f558c81796109ea9192c62343dcd5b7b81c00beaa5',
  },
});

const BUCKET = 'flowsites-media';

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'webm': return 'video/webm';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
    return false;
  }
}

async function migrateFolder(folderName) {
  console.log(`\n========================================`);
  console.log(`Scanning Supabase storage: ${folderName}...`);
  console.log(`========================================`);

  const { data: files, error } = await supabase.storage.from('templates').list(folderName, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error || !files) {
    console.error(`Error listing ${folderName}:`, error);
    return;
  }

  const validFiles = files.filter(f => f.name && !f.name.startsWith('.'));
  console.log(`Found ${validFiles.length} files in ${folderName}`);

  let transferred = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const key = `${folderName}/${file.name}`;
    const progress = `[${i + 1}/${validFiles.length}]`;

    const alreadyThere = await existsInR2(key);
    if (alreadyThere) {
      skipped++;
      if (skipped % 25 === 0 || i === validFiles.length - 1) {
        console.log(`${progress} Already in R2: ${key} (total skipped: ${skipped})`);
      }
      continue;
    }

    const { data: publicUrlData } = supabase.storage.from('templates').getPublicUrl(key);
    const sourceUrl = publicUrlData.publicUrl;

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        console.error(`${progress} Failed to download: ${sourceUrl} (HTTP ${response.status})`);
        failed++;
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = getContentType(file.name);

      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      transferred++;
      const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
      console.log(`${progress} Uploaded to R2: ${key} (${sizeMb} MB)`);
    } catch (err) {
      console.error(`${progress} Error transferring ${key}:`, err.message);
      failed++;
    }
  }

  console.log(`\nCompleted ${folderName}:`);
  console.log(`  - Newly Transferred: ${transferred}`);
  console.log(`  - Already Existed: ${skipped}`);
  console.log(`  - Failed: ${failed}`);
}

async function run() {
  console.log('Starting Migration from Supabase Storage -> Cloudflare R2...');
  await migrateFolder('videos');
  await migrateFolder('images');
  console.log('\n========================================');
  console.log('All files successfully migrated to Cloudflare R2!');
  console.log('========================================');
}

run().catch(console.error);
