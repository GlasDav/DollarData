import React, { useState, useMemo } from 'react';
import { toLocalISOString } from '../utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import * as api from '../services/api';
import { Dialog } from '@headlessui/react';
import { CHART_COLORS } from '../constants/chartColors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Deterministic color generator based on bucket ID
const getBucketColor = (bucketId) => {
    if (!bucketId) return '#cbd5e1'; // Slate-400 for uncategorized
    const index = bucketId % CHART_COLORS.length;
    return CHART_COLORS[index];
};

export default function FinancialCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // For modal

    // Calculate dates
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // API uses ISO strings
    const startStr = toLocalISOString(startOfMonth);
    const endStr = toLocalISOString(endOfMonth);

    // Data Fetching
    const { data: transactions = [], isLoading: loadingTxns } = useQuery({
        queryKey: ['calendar', startStr, endStr],
        queryFn: () => api.getCalendarData(startStr, endStr)
    });

    const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: api.getSubscriptions
    });

    // --- Derived State ---

    // 1. Project Subscriptions into "Events"
    const projectedEvents = useMemo(() => {
        const events = [];
        if (!Array.isArray(subscriptions)) return events;

        subscriptions.forEach(sub => {
            if (!sub.is_active) return;

            const due = new Date(sub.next_due_date);
            const freq = sub.frequency;
            const amount = sub.amount;

            // Helper to add event
            const addEvent = (date) => {
                // Only add if in current view month
                if (date.getMonth() === month && date.getFullYear() === year) {
                    events.push({
                        id: `proj-${sub.id}-${date.getDate()}`,
                        date: toLocalISOString(date),
                        amount: -Math.abs(amount), // Ensure negative for expenses
                        description: sub.name,
                        isProjected: true,
                        // Use a distinct color for projected items if needed, or derive from bucket
                        bucket: {
                            name: 'Recurring',
                            color: sub.bucket_id ? getBucketColor(sub.bucket_id) : '#a5b4fc',
                            id: sub.bucket_id
                        }
                    });
                }
            };

            if (freq === 'Monthly') {
                // Project onto this month's day
                // Handle short months
                const day = due.getDate();
                const maxDays = endOfMonth.getDate();
                const actualDay = Math.min(day, maxDays);
                addEvent(new Date(year, month, actualDay));
            } else if (freq === 'Weekly') {
                // Robust Weekly Logic:
                // Start from "Next Due" date logic. 
                // If next_due is in valid range, iterate forward/backward to fill month.

                // Align to correct day of week relative to next_due_date
                const dueDayOfWeek = due.getDay();

                // Start a cursor at the first day of the month
                let cursor = new Date(year, month, 1);

                // Advance cursor until it matches the due day of week
                while (cursor.getDay() !== dueDayOfWeek) {
                    cursor.setDate(cursor.getDate() + 1);
                }

                // Now iterate through the month
                while (cursor <= endOfMonth) {
                    // Optional: Check if cursor date corresponds to the bi-weekly/weekly cycle correctly relative to start date?
                    // For simple 'Weekly', any matching day-of-week is valid.
                    addEvent(new Date(cursor));
                    cursor.setDate(cursor.getDate() + 7);
                }
            } else if (freq === 'Fortnightly') {
                // Align with next_due_date strictly
                let cursor = new Date(due);

                // Backtrack to find first occurrence before or in this month
                // Safety break to prevent infinite loops
                let safety = 0;
                while (cursor > startOfMonth && safety < 100) {
                    cursor.setDate(cursor.getDate() - 14);
                    safety++;
                }

                // Now move forward
                safety = 0;
                while (cursor <= endOfMonth && safety < 100) {
                    if (cursor >= startOfMonth) {
                        addEvent(new Date(cursor));
                    }
                    cursor.setDate(cursor.getDate() + 14);
                    safety++;
                }
            } else if (freq === 'Yearly') {
                if (due.getMonth() === month) {
                    // Show if due date is in this month of this year
                    // Or just generic "Every September" --> Show in September regardless of year?
                    // Usually for bills, we want strict projection based on next status.
                    // If next due is 2026, don't show in 2025.
                    if (due.getFullYear() === year) {
                        addEvent(new Date(due)); // Ensure new Date object
                    }
                }
            }
        });
        return events;
    }, [subscriptions, year, month, endOfMonth, startOfMonth]);

    // Helper to decode HTML entities (e.g. "Food &amp; Drink" -> "Food & Drink")
    const decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    // Helper to get the "Display Bucket" (Parent if exists, else Self)
    const getDisplayBucket = (bucket) => {
        if (!bucket) return { name: 'Uncategorized', color: '#cbd5e1', id: 'uncat' };

        // If parent exists, use parent info
        if (bucket.parent) {
            return {
                id: bucket.parent.id,
                name: decodeHtml(bucket.parent.name),
                color: getBucketColor(bucket.parent.id), // Parent ID determines color
                isParent: true
            };
        }

        // Fallback to self
        return {
            id: bucket.id,
            name: decodeHtml(bucket.name),
            color: bucket.color || getBucketColor(bucket.id),
            isParent: false
        };
    };

    // 2. Merge Actual + Projected
    const combinedData = useMemo(() => {
        const map = {};

        // Add Actuals
        transactions.forEach(txn => {
            if (txn.bucket?.is_transfer) return;

            const dateKey = txn.date.split('T')[0];
            if (!map[dateKey]) map[dateKey] = { txns: [], total: 0, hasProjected: false };

            // Resolve Display Bucket (Parent or Self)
            const displayBucket = getDisplayBucket(txn.bucket);

            const processedTxn = {
                ...txn,
                displayBucket // Attach for rendering
            };

            map[dateKey].txns.push(processedTxn);
            if (txn.amount < 0) map[dateKey].total += Math.abs(txn.amount);
        });

        // Add Projected
        projectedEvents.forEach(p => {
            const dateKey = p.date;
            if (!map[dateKey]) map[dateKey] = { txns: [], total: 0, hasProjected: true };

            const todayStr = toLocalISOString(new Date());

            if (dateKey >= todayStr) {
                // For projected, we constructed a bucket object manually in Step 1
                // logic needs to be robust if p.bucket is just {name, color, id} without parent info
                // However, subscriptions usually point to a bucket_id. 
                // We might not have full parent info for subscriptions unless we fetch it.
                // For now, let's stick to the bucket info we have or try to find it in transactions?
                // Ideally, we should fetch full bucket info for subscriptions too.
                // But for "Recurring", we often group them all together or use the specific bucket color.

                // If we want consistent parent grouping, we need to lookup the bucket by ID from a master list
                // OR we can just rely on what we have. 
                // Let's rely on what we have for now, but decode name.

                const displayBucket = {
                    id: p.bucket.id || 'recurring',
                    name: decodeHtml(p.bucket.name),
                    color: p.bucket.color
                };

                map[dateKey].txns.push({ ...p, displayBucket });
                map[dateKey].hasProjected = true;
            }
        });

        return map;
    }, [transactions, projectedEvents]);


    // Calendar Grid Logic
    const startDay = startOfMonth.getDay(); // 0-6
    const daysInMonth = endOfMonth.getDate();

    const renderCells = () => {
        const cells = [];
        // Padding
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`pad-${i}`} className="h-24 md:h-32 bg-slate-50/50 dark:bg-slate-900/20 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0" />);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const data = combinedData[dateKey]; // { txns: [], total: 0, hasProjected: bool }
            const isToday = new Date().toDateString() === dateObj.toDateString();

            const actuals = data?.txns.filter(t => !t.isProjected) || [];
            const projected = data?.txns.filter(t => t.isProjected) || [];
            const dailyTotal = data?.total || 0;

            cells.push(
                <div
                    key={d}
                    onClick={() => (actuals.length || projected.length) && setSelectedDate({ date: dateObj, txns: [...actuals, ...projected], total: dailyTotal })}
                    className={`
                        h-24 md:h-32 border-b border-r border-slate-100 dark:border-slate-800 p-2 relative group transition-all
                        ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-white dark:bg-slate-900'}
                        ${(actuals.length || projected.length) ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`
                            text-sm font-medium block w-6 h-6 text-center leading-6 rounded-full
                            ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}
                        `}>{d}</span>

                        {dailyTotal > 0 && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                ${dailyTotal.toFixed(0)}
                            </span>
                        )}
                    </div>

                    {data && (
                        <div className="mt-2 space-y-1">
                            {/* Dots Container */}
                            <div className="flex flex-wrap gap-1 content-start">
                                {actuals.map(t => (
                                    <div
                                        key={t.id}
                                        className="w-2 h-2 rounded-full cursor-help hover:scale-125 transition-transform"
                                        style={{ backgroundColor: t.displayBucket.color }}
                                        title={`${t.description} (${t.displayBucket.name}): $${Math.abs(t.amount).toFixed(2)}`}
                                    />
                                ))}

                                {projected.map(t => (
                                    <div
                                        key={t.id}
                                        className="w-2 h-2 rounded-full border border-indigo-400 bg-white dark:bg-slate-800 cursor-help hover:scale-125 transition-transform"
                                        title={`Due: ${t.description} ($${Math.abs(t.amount).toFixed(2)})`}
                                    />
                                ))}
                            </div>

                            {/* Projected Label */}
                            {projected.length > 0 && (
                                <div className="absolute bottom-1 right-2 left-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-end gap-1 opacity-80">
                                    <Clock size={10} />
                                    <span>${Math.abs(projected.reduce((sum, t) => sum + t.amount, 0)).toFixed(0)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        return cells;
    };

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <CalendarIcon className="text-indigo-600" />
                        Financial Calendar
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Track daily spending and upcoming bills
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm self-start md:self-auto">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition">
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-white min-w-[140px] text-center select-none">
                        {currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition">
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Grid Header */}
            <div className="rounded-t-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="grid grid-cols-7">
                    {DAYS.map(d => (
                        <div key={d} className="py-3 text-center text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 bg-white dark:bg-slate-900 shadow-sm rounded-b-xl overflow-hidden border-l border-b border-t-0 border-r border-slate-200 dark:border-slate-700">
                {loadingTxns || loadingSubs ? (
                    <div className="col-span-7 h-96 flex items-center justify-center text-slate-500">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-8 w-8 bg-slate-200 rounded-full mb-2"></div>
                            <span>Loading Calendar...</span>
                        </div>
                    </div>
                ) : renderCells()}
            </div>

            {/* Day Detail Modal */}
            <Dialog
                open={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <Dialog.Title className="text-xl font-bold text-slate-900 dark:text-white">
                                {selectedDate?.date.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </Dialog.Title>
                            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {selectedDate?.txns.length === 0 && (
                                <div className="p-8 text-center text-slate-500">No transactions for this day.</div>
                            )}
                            {selectedDate?.txns.map(t => (
                                <div key={t.id} className={`flex justify-between items-center p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${t.isProjected ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        {t.isProjected ? (
                                            <div className="w-3 h-3 rounded-full border-2 border-indigo-500 flex-shrink-0" />
                                        ) : (
                                            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: t.displayBucket?.color || t.bucket?.color }} />
                                        )}

                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                {t.description}
                                                {t.isProjected && (
                                                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        Due
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {t.displayBucket?.name || t.bucket?.name || 'Uncategorized'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${t.amount < 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'} ${t.isProjected ? 'opacity-80' : ''}`}>
                                        {t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `+$${t.amount.toFixed(2)}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Total Spent</span>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">${selectedDate?.total.toFixed(2)}</span>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Calendar Legend */}
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Categories</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {/* Unique display buckets from current view */}
                    {Object.values(combinedData).flatMap(d => d.txns)
                        .map(t => t.displayBucket ? JSON.stringify(t.displayBucket) : null)
                        .filter(Boolean)
                        .reduce((acc, curr) => {
                            if (!acc.includes(curr)) acc.push(curr);
                            return acc;
                        }, [])
                        .map(s => JSON.parse(s))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((bucket, idx) => (
                            <div key={`${bucket.id}-${idx}`} className="flex items-center gap-2">
                                <div
                                    className={`w-3 h-3 rounded-full shadow-sm flex-shrink-0 ${bucket.name === 'Recurring' ? 'border-2 border-indigo-500 bg-transparent' : ''}`}
                                    style={{ backgroundColor: bucket.name === 'Recurring' ? 'transparent' : bucket.color }}
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{bucket.name}</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
