import { API_BASE } from '../constants/api';

/**
 * Returns a full absolute URL for a user's avatar image.
 * Handles both absolute URLs (e.g. Google OAuth) and relative paths stored in Laravel (e.g. "avatars/avatar_4_...").
 */
export function getAvatarUri(user: any): string | null {
  const avatar = user?.avatar_url || user?.avatar;
  if (!avatar || typeof avatar !== 'string') {
    return null;
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  const cleanPath = avatar.replace(/^\/+/, '');
  return `${API_BASE}/${cleanPath}`;
}
