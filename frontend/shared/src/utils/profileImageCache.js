// The mobile app's own copy of this file does on-disk caching via
// expo-file-system (native-only). This shared package has no such
// filesystem to write to, and doesn't need one: profile images are served
// with long-lived immutable Cache-Control headers (see media.service.js),
// so the platform's own HTTP cache already does this job.
// authSlice calls this as cacheProfileImage(url) — single arg.
export const cacheProfileImage = async (remoteUrl) => remoteUrl;

export const clearProfileImageCache = async () => {};
