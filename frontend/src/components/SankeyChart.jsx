import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

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

    // Custom Node
    const renderNode = (props) => {
        const { x, y, width, height, index, payload, containerWidth } = props;

        // Configuration
        const isLeft = x < containerWidth / 2;
        const textAnchor = isLeft ? 'end' : 'start';
        const xPos = isLeft ? x - 6 : x + width + 6;
        const yPos = y + height / 2;

        // Make sure node has minimum height for visibility
        const minHeight = Math.max(height, 8);

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={minHeight}
                    fill="#6366f1"
                    fillOpacity={0.8}
                    rx={4}
                />

                {/* Node Label */}
                <text
                    x={xPos}
                    y={yPos - 6}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill="#334155"
                    fontSize={11}
                    fontWeight="bold"
                    className="dark:fill-slate-200"
                    style={{ pointerEvents: 'none' }}
                >
                    {payload.name}
                </text>

                {/* Node Value */}
                <text
                    x={xPos}
                    y={yPos + 8}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill="#64748b"
                    fontSize={10}
                    fontWeight="medium"
                    className="dark:fill-slate-400"
                    style={{ pointerEvents: 'none' }}
                >
                    {formatCurrency(payload.value)}
                </text>
            </g>
        );
    };

    // Custom Link with proper gradient and width
    const renderLink = (props) => {
        const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;

        // Ensure minimum link width for visibility
        const minWidth = Math.max(linkWidth || 2, 2);

        return (
            <path
                d={`
                    M${sourceX},${sourceY}
                    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
                `}
                fill="none"
                stroke="#818cf8"
                strokeWidth={minWidth}
                strokeOpacity={0.5}
            />
        );
    };

    // Calculate appropriate height - cap at reasonable max
    const nodeCount = Math.max(
        data.nodes.filter((_, i) => i === 0 || data.links.some(l => l.source === 0)).length,
        data.nodes.filter((_, i) => i !== 0 && !data.links.some(l => l.target === i && l.source === 0)).length
    );
    // Base height of 350, add 30px per category node, cap at 600
    const calculatedHeight = Math.min(600, Math.max(350, nodeCount * 35 + 100));

    // Node padding based on number of categories
    const nodePadding = Math.max(20, Math.min(50, 300 / data.nodes.length));

    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 transition-all duration-300 flex flex-col" style={{ height: `${calculatedHeight}px` }}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 shrink-0">Cash Flow</h3>
            <div className="flex-1 min-h-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={data}
                        link={renderLink}
                        nodePadding={nodePadding}
                        nodeWidth={10}
                        margin={{ left: 120, right: 120, top: 5, bottom: 5 }}
                        node={renderNode}
                    >
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => formatCurrency(value)}
                        />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SankeyChart;
