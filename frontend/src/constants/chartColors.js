/**
 * Shared chart color palette for consistent styling across all charts.
 * Use this in all Recharts components for visual consistency.
 */

// Primary chart color palette - Extended 20 colors for maximum distinction
// Note: Ordered for maximum distinction (colorblind-friendly where possible)
export const CHART_COLORS = [
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#0ea5e9', // Sky
    '#d946ef', // Fuchsia
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#a855f7', // Purple
    '#eab308', // Yellow
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#ef4444', // Red
    '#64748b', // Slate (Neutral)
    '#a1a1aa', // Zinc (Neutral)
    '#78716c', // Stone (Neutral)
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
