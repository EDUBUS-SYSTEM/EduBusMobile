/**
 * Format ISO date string to time string (HH:mm) in local timezone (Vietnam)
 * @param iso - ISO date string
 * @returns Formatted time string (HH:mm)
 */
export const toHourMinute = (iso: string): string => {
    const date = new Date(iso);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};
/**
 * Get today's date in ISO format (YYYY-MM-DD) using local timezone
 * This ensures correct date regardless of UTC offset
 * @returns Today's date string in format YYYY-MM-DD
 */
export const getTodayISOString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};