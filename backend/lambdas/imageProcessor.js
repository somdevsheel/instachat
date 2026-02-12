// const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
// const sharp = require('sharp');
// const path = require('path');

// /* ======================================================
//    AWS CLIENT
// ====================================================== */
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
// });

// /* ======================================================
//    IMAGE VARIANT CONFIG
// ====================================================== */
// const IMAGE_SIZES = {
//   thumbnail: { width: 150 },
//   medium: { width: 1080 },
//   original: { width: 2048 },
// };

// /* ======================================================
//    MAIN HANDLER
// ====================================================== */
// exports.handler = async (event) => {
//   try {
//     for (const record of event.Records) {
//       const bucket = record.s3.bucket.name; // ✅ SAFE SOURCE
//       const key = decodeURIComponent(
//         record.s3.object.key.replace(/\+/g, ' ')
//       );

//       // Process ONLY raw image uploads
//       if (!key.startsWith('raw/images/')) continue;

//       console.log('📸 Processing image:', key);

//       const imageBuffer = await downloadFromS3(bucket, key);

//       const filename = path.basename(key, path.extname(key));
//       const userFolder = key.split('/')[2] || 'unknown';

//       for (const [variant, size] of Object.entries(IMAGE_SIZES)) {
//         const outputKey = `processed/images/${variant}/${userFolder}/${filename}.webp`;

//         const processedImage = await sharp(imageBuffer)
//           .resize({
//             width: size.width,
//             withoutEnlargement: true,
//           })
//           .webp({ quality: 80 })
//           .toBuffer();

//         await uploadToS3(bucket, outputKey, processedImage);

//         console.log(`✅ Uploaded: ${outputKey}`);
//       }
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('❌ Image processing failed:', error);
//     throw error;
//   }
// };

// /* ======================================================
//    HELPERS
// ====================================================== */

// const downloadFromS3 = async (bucket, key) => {
//   const command = new GetObjectCommand({
//     Bucket: bucket,
//     Key: key,
//   });

//   const response = await s3.send(command);
//   return streamToBuffer(response.Body);
// };

// const uploadToS3 = async (bucket, key, buffer) => {
//   const command = new PutObjectCommand({
//     Bucket: bucket,
//     Key: key,
//     Body: buffer,
//     ContentType: 'image/webp',
//     CacheControl: 'public, max-age=31536000',
//   });

//   await s3.send(command);
// };

// const streamToBuffer = (stream) =>
//   new Promise((resolve, reject) => {
//     const chunks = [];
//     stream.on('data', (chunk) => chunks.push(chunk));
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//     stream.on('error', reject);
//   });



const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const path = require('path');

/* ======================================================
   AWS CLIENT
====================================================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

/* ======================================================
   IMAGE VARIANTS
====================================================== */
const IMAGE_SIZES = {
  thumbnail: 150,
  medium: 1080,
};

/* ======================================================
   HANDLER
====================================================== */
exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' ')
      );

      // ✅ Only process original post images
      if (!key.includes('/posts/images/') || key.includes('/thumbnail/') || key.includes('/medium/')) {
        continue;
      }

      console.log('📸 Processing image:', key);

      /*
        Expected key:
        users/{userId}/posts/images/{filename}.jpg
      */
      const parts = key.split('/');
      const userId = parts[1];
      const filename = path.basename(key, path.extname(key));

      // Download original image
      const imageBuffer = await downloadFromS3(bucket, key);

      // Generate variants
      for (const [variant, width] of Object.entries(IMAGE_SIZES)) {
        const outputKey =
          `users/${userId}/posts/images/${variant}/${filename}.webp`;

        const outputBuffer = await sharp(imageBuffer)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        await uploadToS3(bucket, outputKey, outputBuffer, 'image/webp');

        console.log(`✅ Uploaded ${variant}: ${outputKey}`);
      }

    } catch (err) {
      console.error('❌ Image processing failed:', err);
    }
  }

  return { success: true };
};

/* ======================================================
   HELPERS
====================================================== */

const downloadFromS3 = async (bucket, key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3.send(command);
  return streamToBuffer(response.Body);
};

const uploadToS3 = async (bucket, key, buffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await s3.send(command);
};

const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
