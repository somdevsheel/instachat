// Reposts have no media/caption of their own — the actual content lives
// on the original post/reel they wrap.
export function getRepostDisplayMedia(post) {
  if (!post.repostOf) return post.media;
  if (post.repostOfModel === 'Reel') {
    return {
      type: 'video',
      variants: { original: post.repostOf.videoUrl, thumbnail: post.repostOf.thumbnailUrl },
    };
  }
  return post.repostOf.media;
}
