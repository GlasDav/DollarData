/**
 * Shared chart color palette for consistent styling across all charts.
 * Use this in all Recharts components for visual consistency.
 */

// Primary chart color palette - Premium & Vibrant (High Contrast)
// darker shades (600s) for better visibility on light backgrounds and premium feel
export const CHART_COLORS = [
    '#2563EB', // Blue 600
    '#16A34A', // Green 600
    '#DC2626', // Red 600
    '#D97706', // Amber 600
    '#9333EA', // Purple 600
    '#0891B2', // Cyan 600
    '#BE185D', // Pink 700
    '#4F46E5', // Indigo 600
    '#059669', // Emerald 600
    '#EA580C', // Orange 600
    '#7C3AED', // Violet 600
    '#475569', // Slate 600
    '#DB2777', // Pink 600
    '#65A30D', // Lime 600
    '#22D3EE', // Cyan 400 (Bright Accent)
    '#F472B6', // Pink 400 (Bright Accent)
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
