// ── Central API configuration ──
// Change this single value when switching between tunnel / LAN / production
const RAW_API_BASE = 'http://carwash.local';
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');
