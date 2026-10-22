// Public Terms / Privacy Policy pages live on the web app (one source of
// truth, and app stores need a public URL). Set EXPO_PUBLIC_WEB_URL;
// otherwise it's derived from the API URL (api.example.com -> example.com).
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.grownoww.com/api/v1';

export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ||
  apiUrl.replace(/\/api\/v1\/?$/, '').replace('://api.', '://');

export const TERMS_URL = `${WEB_URL}/terms`;
export const PRIVACY_URL = `${WEB_URL}/privacy`;
