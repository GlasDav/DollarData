/**
 * Text utilities for handling display of text from the backend
 */

/**
 * Decode HTML entities in a string.
 * This is necessary because the backend escapes HTML entities for security,
 * but React's JSX already escapes text content, causing double-encoding.
 * 
 * @param {string} text - The text to decode
 * @returns {string} - Decoded text
 */
export function decodeHtmlEntities(text) {
    if (!text || typeof text !== 'string') return text;

    // Use a textarea element to decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

/**
 * Decode HTML entities in an object's name field.
 * Useful for processing arrays of items with 'name' properties.
 * 
 * @param {Object} item - Object with a 'name' property
 * @returns {Object} - Same object with decoded name
 */
export function decodeItemName(item) {
    if (!item) return item;
    return {
        ...item,
        name: decodeHtmlEntities(item.name)
    };
}

/**
 * Recursively decode names in a tree structure (e.g., category trees).
 * 
 * @param {Array} items - Array of items with 'name' and optional 'children'
 * @returns {Array} - Same structure with decoded names
 */
export function decodeNamesInTree(items) {
    if (!Array.isArray(items)) return items;

    return items.map(item => ({
        ...item,
        name: decodeHtmlEntities(item.name),
        children: item.children ? decodeNamesInTree(item.children) : undefined
    }));
}
