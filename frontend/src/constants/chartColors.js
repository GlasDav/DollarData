/**
 * Shared chart color palette for consistent styling across all charts.
 * Use this in all Recharts components for visual consistency.
 */

// Primary chart color palette - 8 colors for pie/bar charts
export const CHART_COLORS = [
    '#6366f1', // Indigo (primary)
    '#10b981', // Emerald (success)
    '#f59e0b', // Amber (warning)
    '#ef4444', // Red (error)
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
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
