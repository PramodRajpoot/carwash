/**
 * Checks whether a given time slot on a specific date has already passed.
 * Supports "HH:MM AM - HH:MM PM" (and variations with en-dash/em-dash).
 */
export function isSlotTimePassed(dateStr?: string | null, timeRange?: string | null): boolean {
  if (!dateStr || !timeRange) return false;

  const cleanDateStr = String(dateStr).split('T')[0].trim();
  const parts = cleanDateStr.split('-');
  if (parts.length < 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(year, month, day);

  if (targetDate < today) return true;
  if (targetDate > today) return false;

  // Same day: check slot start time
  const startStr = timeRange.split(/[-–—]/)[0].trim();
  const match = startStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return false;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const slotStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  return now >= slotStartTime;
}
