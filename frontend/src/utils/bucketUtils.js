/**
 * Utility functions for bucket/category handling
 */

// Group order for sorting
const GROUP_ORDER = {
    'Income': 0,
    'Non-Discretionary': 1,
    'Discretionary': 2,
};

/**
 * Sort buckets by group (Income, Non-Discretionary, Discretionary) then alphabetically
 * @param {Array} buckets - Array of bucket objects with name and group properties
 * @returns {Array} - Sorted array of buckets
 */
export const sortBucketsByGroup = (buckets) => {
    if (!buckets || !Array.isArray(buckets)) return [];

    return [...buckets].sort((a, b) => {
        // First sort by group order
        const groupOrderA = GROUP_ORDER[a.group] ?? 999;
        const groupOrderB = GROUP_ORDER[b.group] ?? 999;

        if (groupOrderA !== groupOrderB) {
            return groupOrderA - groupOrderB;
        }

        // Then sort alphabetically within group
        return (a.name || '').localeCompare(b.name || '');
    });
};

/**
 * Group buckets by their group property for optgroup rendering
 * @param {Array} buckets - Array of bucket objects
 * @returns {Object} - Object with group names as keys and bucket arrays as values
 */
export const groupBuckets = (buckets) => {
    if (!buckets || !Array.isArray(buckets)) return {};

    const sorted = sortBucketsByGroup(buckets);

    return sorted.reduce((acc, bucket) => {
        const group = bucket.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(bucket);
        return acc;
    }, {});
};
