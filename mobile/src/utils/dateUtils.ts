/**
 * Format a date as YYYY-MM-DD using the local timezone.
 * This prevents the off-by-one day error caused by toISOString() using UTC.
 * 
 * @param date - The date to format
 * @returns string - YYYY-MM-DD string in local time
 */
export const toLocalISOString = (date: Date): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
