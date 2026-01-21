import { getPresignedUploadUrl } from '../api/Media.api';
import { createPost } from '../api/Posts.api';
import { uploadToS3 } from './uploadToS3';
import feedEvents from './feedEvents';

class UploadQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(item) {
    this.queue.push(item);
    this.processNext();
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;

    const item = this.queue.shift();
    this.processing = true;

    try {
      const mediaType = item.file.type.startsWith('video')
        ? 'video'
        : 'image';

      const presignRes = await getPresignedUploadUrl({
        mediaType,
        mimeType: item.file.type,
        fileSizeMB: item.file.sizeMB,
      });

      const { uploadUrl, key } = presignRes.data;

      await uploadToS3({
        uploadUrl,
        fileUri: item.file.uri,
        mimeType: item.file.type,
      });

      await createPost({
        caption: item.caption || '',
        media: {
          type: mediaType,
          originalKey: key,
        },
      });

      feedEvents.emit('refreshFeed');

    } catch (err) {
      console.error('❌ Upload failed:', err);
    } finally {
      this.processing = false;
    }
  }
}

export const uploadQueue = new UploadQueue();
