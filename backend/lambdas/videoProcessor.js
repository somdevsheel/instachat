// const {
//   S3Client,
//   GetObjectCommand,
//   PutObjectCommand,
// } = require('@aws-sdk/client-s3');

// const ffmpeg = require('fluent-ffmpeg');
// const fs = require('fs');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');

// /* ======================================================
//    AWS CLIENT
// ====================================================== */
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
// });

// /* ======================================================
//    MAIN HANDLER
// ====================================================== */
// exports.handler = async (event) => {
//   try {
//     for (const record of event.Records) {
//       const bucket = record.s3.bucket.name;
//       const key = decodeURIComponent(
//         record.s3.object.key.replace(/\+/g, ' ')
//       );

//       // ✅ Only process raw video uploads
//       if (!key.startsWith('raw/videos/')) continue;

//       console.log('🎬 Processing video:', key);

//       const localVideoPath = `/tmp/${uuidv4()}.mp4`;
//       const localThumbPath = `/tmp/${uuidv4()}.jpg`;

//       // 1️⃣ Download video from S3
//       await downloadFromS3(bucket, key, localVideoPath);

//       // 2️⃣ Extract thumbnail
//       await extractThumbnail(localVideoPath, localThumbPath);

//       // 3️⃣ Upload thumbnail back to S3
//       const filename = path.basename(key, path.extname(key));
//       const userId = key.split('/')[2] || 'unknown';

//       const thumbnailKey = `processed/videos/thumbnails/${userId}/${filename}.jpg`;

//       const thumbBuffer = fs.readFileSync(localThumbPath);

//       await uploadToS3(bucket, thumbnailKey, thumbBuffer);

//       console.log(`✅ Thumbnail uploaded: ${thumbnailKey}`);
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('❌ Video processing failed:', error);
//     throw error;
//   }
// };

// /* ======================================================
//    HELPERS
// ====================================================== */

// const downloadFromS3 = async (bucket, key, outputPath) => {
//   const command = new GetObjectCommand({
//     Bucket: bucket,
//     Key: key,
//   });

//   const response = await s3.send(command);
//   const writeStream = fs.createWriteStream(outputPath);

//   await new Promise((resolve, reject) => {
//     response.Body.pipe(writeStream);
//     response.Body.on('error', reject);
//     writeStream.on('finish', resolve);
//   });
// };

// const extractThumbnail = (videoPath, outputPath) =>
//   new Promise((resolve, reject) => {
//     ffmpeg(videoPath)
//       .screenshots({
//         timestamps: ['1'],
//         filename: path.basename(outputPath),
//         folder: path.dirname(outputPath),
//         size: '640x?',
//       })
//       .on('end', resolve)
//       .on('error', reject);
//   });

// const uploadToS3 = async (bucket, key, buffer) => {
//   const command = new PutObjectCommand({
//     Bucket: bucket,
//     Key: key,
//     Body: buffer,
//     ContentType: 'image/jpeg',
//     CacheControl: 'public, max-age=31536000',
//   });

//   await s3.send(command);
// };




const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/* ======================================================
   AWS CLIENT
====================================================== */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

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

      // ✅ Only process original post videos
      if (!key.includes('/posts/videos/')) continue;

      console.log('🎬 Processing video:', key);

      /*
        Expected key:
        users/{userId}/posts/videos/{filename}.mp4
      */
      const parts = key.split('/');
      const userId = parts[1];
      const filename = path.basename(key, path.extname(key));

      const localVideoPath = `/tmp/${uuidv4()}.mp4`;
      const localThumbPath = `/tmp/${uuidv4()}.jpg`;

      // Download video
      await downloadFromS3(bucket, key, localVideoPath);

      // Extract thumbnail
      await extractThumbnail(localVideoPath, localThumbPath);

      // Upload thumbnail
      const thumbKey =
        `users/${userId}/posts/videos/thumbnails/${filename}.jpg`;

      const thumbBuffer = fs.readFileSync(localThumbPath);

      await uploadToS3(bucket, thumbKey, thumbBuffer, 'image/jpeg');

      console.log(`✅ Thumbnail uploaded: ${thumbKey}`);

    } catch (err) {
      console.error('❌ Video processing failed:', err);
    }
  }

  return { success: true };
};

/* ======================================================
   HELPERS
====================================================== */

const downloadFromS3 = async (bucket, key, outputPath) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3.send(command);
  const writeStream = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    response.Body.pipe(writeStream);
    response.Body.on('error', reject);
    writeStream.on('finish', resolve);
  });
};

const extractThumbnail = (videoPath, outputPath) =>
  new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['1'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '640x?',
      })
      .on('end', resolve)
      .on('error', reject);
  });

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
