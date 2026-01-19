/**
 * Shared chart color palette for consistent styling across all charts.
 * Use this in all Recharts components for visual consistency.
 */

// Primary chart color palette - Colorblind-friendly (Okabe-Ito & High Contrast)
// These colors are chosen to be distinct for deuteranopia, protanopia, and tritanopia.
export const CHART_COLORS = [
    '#E69F00', // Orange (Okabe-Ito)
    '#56B4E9', // Sky Blue (Okabe-Ito)
    '#009E73', // Bluish Green (Okabe-Ito)
    '#F0E442', // Yellow (Okabe-Ito)
    '#0072B2', // Blue (Okabe-Ito)
    '#D55E00', // Vermilion (Okabe-Ito)
    '#CC79A7', // Reddish Purple (Okabe-Ito)
    '#882255', // Wine
    '#44AA99', // Teal
    '#117733', // Green
    '#332288', // Indigo
    '#DDCC77', // Sand
    '#999933', // Olive
    '#CC6677', // Rose
    '#88CCEE', // Cyan
    '#AA4499', // Purple
    '#64748b', // Slate
    '#a1a1aa', // Zinc
];

// Income-specific greens (for income pie charts)
export const INCOME_COLORS = [
    '#10b981', // Emerald-500
    '#34d399', // Emerald-400
    '#6ee7b7', // Emerald-300
    '#a7f3d0', // Emerald-200
];

// Asset vs Liability colors
export const ASSET_COLOR = '#10b981';  // Emerald
export const LIABILITY_COLOR = '#ef4444'; // Red
export const NET_WORTH_COLOR = '#6366f1'; // Indigo (primary)

// Chart styling defaults
export const CHART_TOOLTIP_STYLE = {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

export const CHART_LEGEND_STYLE = {
    fontSize: '11px',
    lineHeight: '18px'
};
