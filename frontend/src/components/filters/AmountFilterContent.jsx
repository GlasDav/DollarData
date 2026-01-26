import React, { useState } from 'react';

export default function AmountFilterContent({ minAmount, maxAmount, onChange, close }) {
    const [localMin, setLocalMin] = useState(minAmount || '');
    const [localMax, setLocalMax] = useState(maxAmount || '');

    const handleApply = () => {
        onChange({
            min: localMin !== '' ? parseFloat(localMin) : null,
            max: localMax !== '' ? parseFloat(localMax) : null
        });
        close();
    };

    return (
        <div className="w-[280px] p-4 space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                    Amount Range ($)
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        className="w-full bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <span className="text-text-muted">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        className="w-full bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border-dark">
                <button
                    onClick={() => {
                        onChange(null);
                        close();
                    }}
                    className="text-white bg-slate-500 hover:bg-slate-600 px-3 py-1.5 rounded text-xs font-medium transition"
                >
                    Clear
                </button>
                <button
                    onClick={handleApply}
                    disabled={localMin === '' && localMax === ''}
                    className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}
