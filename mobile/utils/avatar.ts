import { API_BASE } from '../constants/api';

/**
 * Returns a full absolute URL for a user's avatar image.
 * Handles:
 * - Local uploads ("avatars/avatar_242_....jpeg")
 * - Legacy/obsolete backend APP_URLs ("http://187.126.119.129/avatars/...", "http://carwash.local/avatars/...")
 * - External OAuth URLs (e.g. Google OAuth "https://lh3.googleusercontent.com/...")
 */
export function getAvatarUri(user: any): string | null {
  const rawAvatar = user?.avatar || user?.avatar_url;
  if (!rawAvatar || typeof rawAvatar !== 'string') {
    return null;
  }

  // 1. If it's a locally uploaded avatar (contains "avatars/")
  const avatarIndex = rawAvatar.indexOf('avatars/');
  if (avatarIndex !== -1) {
    const relativePath = rawAvatar.slice(avatarIndex);
    return `${API_BASE}/${relativePath}`;
  }

  // 2. If it's an external third-party URL (e.g., Google OAuth profile photo)
  if (rawAvatar.startsWith('https://') || rawAvatar.startsWith('http://')) {
    // If it points to an obsolete dev IP or local domain without "avatars/", normalize it
    if (
      rawAvatar.includes('187.126.119.129') ||
      rawAvatar.includes('carwash.local') ||
      rawAvatar.includes('localhost') ||
      rawAvatar.includes('127.0.0.1')
    ) {
      try {
        const urlObj = new URL(rawAvatar);
        const path = urlObj.pathname.replace(/^\/+/, '');
        return `${API_BASE}/${path}`;
      } catch {
        return null;
      }
    }
    return rawAvatar;
  }

  // 3. Fallback for any other relative image path
  const cleanPath = rawAvatar.replace(/^\/+/, '');
  return `${API_BASE}/${cleanPath}`;
}
