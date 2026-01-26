import React, { useState } from 'react';

export default function DateFilterContent({ startDate, endDate, onChange, close }) {
    const [localStart, setLocalStart] = useState(startDate || '');
    const [localEnd, setLocalEnd] = useState(endDate || '');

    const handleApply = () => {
        onChange({
            start: localStart || null,
            end: localEnd || null
        });
        close();
    };

    return (
        <div className="w-[300px] p-4 space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                    Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-text-muted mb-1 block">From</label>
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => setLocalStart(e.target.value)}
                            className="w-full bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-text-muted mb-1 block">To</label>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => setLocalEnd(e.target.value)}
                            className="w-full bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
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
                    disabled={!localStart && !localEnd}
                    className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}
