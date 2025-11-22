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

/**
 * Formats a date string into a relative time (e.g., "5m ago", "2d ago")
 * Falls back to a locale date string for differences >= 7 days
 * @param dateString - ISO date string
 */
export const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};