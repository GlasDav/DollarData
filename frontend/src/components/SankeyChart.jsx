import React from 'react';
import { Sankey, Tooltip, Layer, Rectangle } from 'recharts';

const SankeyChart = ({ data }) => {
    if (!data || !data.nodes || data.nodes.length === 0 || !data.links || data.links.length === 0) {
        return (
            <div className="w-full h-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Cash Flow</h3>
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    No data available for flow chart
                </div>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    // Custom Node with labels outside
    const CustomNode = ({ x, y, width, height, index, payload, containerWidth }) => {
        const isLeft = x < containerWidth / 2;
        const textAnchor = isLeft ? 'end' : 'start';
        const xPos = isLeft ? x - 6 : x + width + 6;
        const yPos = y + height / 2;
        const minHeight = Math.max(height, 4);

        return (
            <Layer key={`node-${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={minHeight}
                    fill="#6366f1"
                    fillOpacity={0.9}
                />
                <text
                    x={xPos}
                    y={yPos - 5}
                    textAnchor={textAnchor}
                    fill="#e2e8f0"
                    fontSize={10}
                    fontWeight="600"
                >
                    {payload.name}
                </text>
                <text
                    x={xPos}
                    y={yPos + 7}
                    textAnchor={textAnchor}
                    fill="#94a3b8"
                    fontSize={9}
                >
                    {formatCurrency(payload.value)}
                </text>
            </Layer>
        );
    };

    // Custom Link with gradient fill
    const CustomLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload }) => {
        const gradientId = `linkGradient${index}`;
        // Ensure minimum visible width
        const width = Math.max(linkWidth || 1, 2);

        return (
            <Layer key={`link-${index}`}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.4} />
                    </linearGradient>
                </defs>
                <path
                    d={`
                        M${sourceX},${sourceY}
                        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
                    `}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={width}
                    fill="none"
                    strokeOpacity={0.7}
                />
            </Layer>
        );
    };

    // Calculate height based on number of destination nodes (categories)
    // Count unique target nodes (excluding the source nodes like Income, Savings, etc)
    const categoryCount = data.nodes.length - 4; // Subtract source nodes (Income, Non-Disc, Disc, Savings)
    const chartHeight = Math.max(400, Math.min(800, categoryCount * 28 + 100));
    const nodePadding = Math.max(8, Math.min(30, 400 / categoryCount));

    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 shrink-0">Cash Flow</h3>
            <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <div style={{ height: `${chartHeight}px`, minHeight: '400px' }}>
                    <Sankey
                        width={800}
                        height={chartHeight}
                        data={data}
                        node={<CustomNode />}
                        link={<CustomLink />}
                        nodePadding={nodePadding}
                        nodeWidth={8}
                        margin={{ left: 120, right: 120, top: 20, bottom: 20 }}
                    >
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                backgroundColor: '#1e293b',
                                color: '#e2e8f0'
                            }}
                            formatter={(value) => formatCurrency(value)}
                        />
                    </Sankey>
                </div>
            </div>
        </div>
    );
};

export default SankeyChart;
