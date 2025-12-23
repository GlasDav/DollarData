/**
 * Skeleton Loading Components
 * 
 * Reusable skeleton loading states for consistent UX across the app.
 * Uses CSS animations for smooth loading appearance.
 */
import React from 'react';

// Base skeleton styles defined inline for portability
const skeletonStyle = {
    background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite',
    borderRadius: '4px',
};

// CSS keyframes injected once
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
if (!document.head.querySelector('[data-skeleton-styles]')) {
    styleSheet.setAttribute('data-skeleton-styles', 'true');
    document.head.appendChild(styleSheet);
}

/**
 * Basic skeleton box with customizable dimensions
 */
export function SkeletonBox({ width = '100%', height = '20px', className = '', style = {} }) {
    return (
        <div
            className={`skeleton-box ${className}`}
            style={{
                ...skeletonStyle,
                width,
                height,
                ...style,
            }}
        />
    );
}

/**
 * Text line skeleton
 */
export function SkeletonText({ lines = 1, width = '100%', className = '' }) {
    return (
        <div className={className}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBox
                    key={i}
                    width={i === lines - 1 && lines > 1 ? '70%' : width}
                    height="16px"
                    style={{ marginBottom: i < lines - 1 ? '8px' : 0 }}
                />
            ))}
        </div>
    );
}

/**
 * Avatar/Circle skeleton
 */
export function SkeletonCircle({ size = '40px', className = '' }) {
    return (
        <SkeletonBox
            width={size}
            height={size}
            className={className}
            style={{ borderRadius: '50%' }}
        />
    );
}

/**
 * Card skeleton with title and content
 */
export function SkeletonCard({ className = '' }) {
    return (
        <div
            className={`skeleton-card ${className}`}
            style={{
                padding: '16px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
        >
            <SkeletonBox height="24px" width="60%" style={{ marginBottom: '16px' }} />
            <SkeletonText lines={3} />
        </div>
    );
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 4, className = '' }) {
    return (
        <tr className={className}>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} style={{ padding: '12px 8px' }}>
                    <SkeletonBox height="16px" width={i === 0 ? '80%' : '60%'} />
                </td>
            ))}
        </tr>
    );
}

/**
 * Table skeleton with multiple rows
 */
export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
    return (
        <table className={className} style={{ width: '100%' }}>
            <thead>
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} style={{ padding: '12px 8px', textAlign: 'left' }}>
                            <SkeletonBox height="14px" width="70%" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    );
}

/**
 * Dashboard summary card skeleton
 */
export function SkeletonDashboardCard({ className = '' }) {
    return (
        <div
            className={`skeleton-dashboard-card ${className}`}
            style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
        >
            <SkeletonBox height="14px" width="40%" style={{ marginBottom: '8px' }} />
            <SkeletonBox height="36px" width="60%" style={{ marginBottom: '12px' }} />
            <SkeletonBox height="12px" width="80%" />
        </div>
    );
}

/**
 * Chart skeleton
 */
export function SkeletonChart({ height = '300px', className = '' }) {
    return (
        <div
            className={`skeleton-chart ${className}`}
            style={{
                height,
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80%' }}>
                {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                    <SkeletonBox
                        key={i}
                        width="12%"
                        height={`${h}%`}
                        style={{ borderRadius: '4px 4px 0 0' }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Transaction list item skeleton
 */
export function SkeletonTransactionItem({ className = '' }) {
    return (
        <div
            className={`skeleton-transaction ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
            }}
        >
            <SkeletonCircle size="36px" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
                <SkeletonBox height="16px" width="50%" style={{ marginBottom: '4px' }} />
                <SkeletonBox height="12px" width="30%" />
            </div>
            <SkeletonBox height="18px" width="80px" />
        </div>
    );
}

/**
 * Transaction list skeleton
 */
export function SkeletonTransactionList({ count = 5, className = '' }) {
    return (
        <div className={className}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonTransactionItem key={i} />
            ))}
        </div>
    );
}

/**
 * Budget category skeleton
 */
export function SkeletonBudgetCategory({ className = '' }) {
    return (
        <div
            className={`skeleton-budget ${className}`}
            style={{
                padding: '16px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                marginBottom: '8px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <SkeletonBox height="16px" width="40%" />
                <SkeletonBox height="16px" width="20%" />
            </div>
            <SkeletonBox height="8px" width="100%" style={{ borderRadius: '4px' }} />
        </div>
    );
}

/**
 * Full page loading skeleton
 */
export function SkeletonPage({ className = '' }) {
    return (
        <div className={className} style={{ padding: '24px' }}>
            {/* Header */}
            <SkeletonBox height="32px" width="30%" style={{ marginBottom: '24px' }} />

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <SkeletonDashboardCard />
                <SkeletonDashboardCard />
                <SkeletonDashboardCard />
            </div>

            {/* Main content */}
            <SkeletonChart />
        </div>
    );
}

export default {
    SkeletonBox,
    SkeletonText,
    SkeletonCircle,
    SkeletonCard,
    SkeletonTable,
    SkeletonTableRow,
    SkeletonDashboardCard,
    SkeletonChart,
    SkeletonTransactionItem,
    SkeletonTransactionList,
    SkeletonBudgetCategory,
    SkeletonPage,
};
