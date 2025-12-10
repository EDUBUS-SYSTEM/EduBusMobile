
export const toHourMinute = (iso: string): string => {
    const date = new Date(iso);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const toDate = (value: string | Date | undefined | null): Date | null => {
    if (!value) return null;
    const date = typeof value === 'string' ? new Date(value) : value;
    return isNaN(date.getTime()) ? null : date;
};


export const formatDate = (value: string | Date | undefined | null): string => {
    if (!value) return 'N/A';
    const date = toDate(value);
    if (!date) return typeof value === 'string' ? value : 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};


export const formatDateTime = (value: string | Date | undefined | null): string => {
    if (!value) return 'N/A';
    const date = toDate(value);
    if (!date) return typeof value === 'string' ? value : 'Invalid Date';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};


export const formatTime = (value: string | Date | undefined | null): string => {
    if (!value) return 'N/A';
    const date = toDate(value);
    if (!date) return typeof value === 'string' ? value : 'Invalid Date';
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

export const formatMonthYear = (value: string | Date | undefined | null): string => {
    const date = toDate(value);
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
    });
};

export const formatDateWithWeekday = (value: string | Date | undefined | null): string => {
    const date = toDate(value);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const getTodayISOString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


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