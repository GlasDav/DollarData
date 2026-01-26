import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle, Save, X, Calculator, Pencil } from 'lucide-react';
import api from '../services/api';

/**
 * Format currency for table cells (compact format)
 */
const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    // Handle true zero
    if (Math.abs(val) < 0.01) return '$0';

    const abs = Math.abs(val);
    if (abs >= 1000000) {
        return `$${(abs / 1000000).toFixed(1)}M`;
    }
    if (abs >= 1000) {
        return `$${(abs / 1000).toFixed(0)}k`;
    }
    return `$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

/**
 * EditableCell Component
 * Allows inline editing of account balances.
 */
function EditableCell({ value, onSave, isLiability, date }) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value !== null ? value : '');

    // Reset input when value changes externally
    useEffect(() => {
        setInputValue(value !== null ? value : '');
    }, [value]);

    const handleSave = () => {
        const num = parseFloat(inputValue);
        if (isNaN(num)) {
            setIsEditing(false); // Cancel if invalid
            setInputValue(value !== null ? value : '');
            return;
        }
        onSave(num, date);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(value !== null ? value : '');
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center">
                <input
                    type="number"
                    autoFocus
                    className="w-full min-w-[80px] px-1 py-0.5 text-right text-xs border border-primary rounded bg-white dark:bg-slate-800 focus:outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                />
            </div>
        );
    }

    return (
        <div
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600/50 px-2 py-2.5 -mx-2 -my-2.5 rounded transition-colors flex justify-end items-center"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
        >
            {isLiability && value !== null ? `-${formatCurrency(value)}` : formatCurrency(value)}
        </div>
    );
}

/**
 * AccountRow component for individual account rows
 */
function AccountRow({ account, months, dates, isLiability, onUpdateBalance, onSelectAccount }) {
    const isHECS = account.category === 'HECS';

    return (
        <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            {/* Account Name - FROZEN COLUMN */}
            <td
                className={`sticky left-0 z-10 relative px-3 py-2.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-600 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer group transition-colors ${isHECS
                    ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                onClick={() => {
                    if (onSelectAccount) {
                        onSelectAccount(account);
                    } else {
                        console.warn('onSelectAccount prop is missing!');
                    }
                }}
            >
                <div className="flex justify-between items-center group-hover:pr-1 transition-all">
                    <div className="flex flex-col">
                        <span className={`text-sm font-medium transition-colors ${isHECS
                            ? 'text-amber-700 dark:text-amber-500 group-hover:text-amber-800 dark:group-hover:text-amber-400'
                            : 'text-slate-700 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-primary-light'
                            }`}>
                            {account.name}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">{account.category}</span>
                    </div>
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isHECS ? 'text-amber-600 dark:text-amber-500' : 'text-primary dark:text-primary-light'
                        }`}>
                        {isHECS ? <Calculator size={14} /> : <Pencil size={14} />}
                    </div>
                </div>
            </td>

            {/* Monthly balance columns */}
            {account.balances_by_month.map((balance, idx) => (
                <td
                    key={idx}
                    className="px-2 py-2.5 text-right text-sm whitespace-nowrap text-slate-600 dark:text-slate-300 min-w-[100px]"
                >
                    <EditableCell
                        value={balance}
                        isLiability={isLiability}
                        date={dates[idx]} // Pass the raw date for API update
                        onSave={(newVal) => onUpdateBalance(account.id, dates[idx], newVal)}
                    />
                </td>
            ))}
        </tr>
    );
}

/**
 * TotalRow component for summary rows
 */
function TotalRow({ label, values, colorClass, isBold = false }) {
    return (
        <tr className={`border-b border-slate-200 dark:border-slate-600 ${isBold ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
            <td className={`sticky left-0 z-10 px-3 py-2.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-600 ${isBold ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-50 dark:bg-slate-700/50'} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                <span className={`text-sm ${isBold ? 'font-bold' : 'font-semibold'} ${colorClass}`}>
                    {label}
                </span>
            </td>
            {values.map((val, idx) => (
                <td
                    key={idx}
                    className={`px-2 py-2.5 text-right text-sm whitespace-nowrap ${isBold ? 'font-bold' : 'font-semibold'} ${colorClass}`}
                >
                    {formatCurrency(val)}
                </td>
            ))}
        </tr>
    );
}

/**
 * AccountsHistoryTab - Spreadsheet view of account balance history
 */
export default function AccountsHistoryTab({ onAddAccount, onSelectAccount }) {
    const queryClient = useQueryClient();

    // FETCH DATA
    const { data: historyData, isLoading } = useQuery({
        queryKey: ['accountsHistory'],
        queryFn: async () => (await api.get('/net-worth/accounts-history')).data
    });

    // UPDATE MUTATION
    const updateBalanceMutation = useMutation({
        mutationFn: async ({ accountId, date, balance }) => {
            return api.patch(`/net-worth/accounts/${accountId}/balance`, { date, balance });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accountsHistory']);
            queryClient.invalidateQueries(['netWorthHistory']); // Also update overview
            queryClient.invalidateQueries(['accounts']); // Update generic accounts list if used
        }
    });

    // RECALCULATE MUTATION
    const recalculateMutation = useMutation({
        mutationFn: async () => {
            return api.post('/net-worth/recalculate-all');
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['accountsHistory']);
            queryClient.invalidateQueries(['netWorthHistory']);
            // Optional: Toast notification here if we had toast
        }
    });

    // Separate accounts by type
    const { assetAccounts, liabilityAccounts } = useMemo(() => {
        if (!historyData?.accounts) return { assetAccounts: [], liabilityAccounts: [] };

        return {
            assetAccounts: historyData.accounts.filter(a => a.type === 'Asset'),
            liabilityAccounts: historyData.accounts.filter(a => a.type === 'Liability')
        };
    }, [historyData]);

    const handleUpdateBalance = (accountId, date, newBalance) => {
        updateBalanceMutation.mutate({ accountId, date, balance: newBalance });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    const months = historyData?.months || [];
    const dates = historyData?.dates || []; // Raw dates for API
    const totals = historyData?.totals || {};

    if (months.length === 0) {
        return (
            <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark p-12 text-center">
                <p className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
                    No historical data yet
                </p>
                <p className="text-sm text-text-muted dark:text-text-muted-dark mb-4">
                    Import your net worth history or create a monthly check-in to start tracking.
                </p>
                {onAddAccount && (
                    <button
                        onClick={onAddAccount}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition"
                    >
                        <Plus size={16} />
                        Add Account
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-text-muted dark:text-text-muted-dark flex items-center gap-4">
                    <span>Showing {months.length} months of history</span>
                    {/* Recalculate Button */}
                    <button
                        onClick={() => recalculateMutation.mutate()}
                        disabled={recalculateMutation.isPending}
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
                        title="Fix any calculation inconsistencies"
                    >
                        <RefreshCw size={14} className={recalculateMutation.isPending ? "animate-spin" : ""} />
                        Recalculate Totals
                    </button>
                </div>
                {onAddAccount && (
                    <button
                        onClick={onAddAccount}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition"
                    >
                        <Plus size={16} />
                        Add Account
                    </button>
                )}
            </div>

            {/* Spreadsheet Table */}
            <div className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm max-h-[600px] flex flex-col">
                <div className="overflow-auto relative flex-1">
                    <table className="w-full border-collapse relative">
                        <thead className="sticky top-0 z-20 shadow-sm">
                            <tr className="bg-slate-100 dark:bg-slate-700/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-600">
                                {/* Frozen Account Header */}
                                <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-700/90 px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-slate-600 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Account
                                </th>
                                {months.map((month) => (
                                    <th
                                        key={month}
                                        className="px-2 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap min-w-[100px]"
                                    >
                                        {month}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Assets Section */}
                            {assetAccounts.length > 0 && (
                                <>
                                    <tr className="bg-emerald-50/50 dark:bg-emerald-900/20">
                                        <td
                                            colSpan={months.length + 1}
                                            className="sticky left-0 z-10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide bg-emerald-50/50 dark:bg-emerald-900/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                                        >
                                            Assets
                                        </td>
                                    </tr>
                                    {assetAccounts.map(account => (
                                        <AccountRow
                                            key={account.id}
                                            account={account}
                                            months={months}
                                            dates={dates}
                                            isLiability={false}
                                            onUpdateBalance={handleUpdateBalance}
                                            onSelectAccount={onSelectAccount}
                                        />
                                    ))}
                                    <TotalRow
                                        label="Total Assets"
                                        values={totals.assets_by_month || []}
                                        colorClass="text-emerald-600 dark:text-emerald-400"
                                    />
                                </>
                            )}

                            {/* Liabilities Section */}
                            {liabilityAccounts.length > 0 && (
                                <>
                                    <tr className="bg-red-50/50 dark:bg-red-900/20">
                                        <td
                                            colSpan={months.length + 1}
                                            className="sticky left-0 z-10 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide bg-red-50/50 dark:bg-red-900/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                                        >
                                            Liabilities
                                        </td>
                                    </tr>
                                    {liabilityAccounts.map(account => (
                                        <AccountRow
                                            key={account.id}
                                            account={account}
                                            months={months}
                                            dates={dates}
                                            isLiability={true}
                                            onUpdateBalance={handleUpdateBalance}
                                            onSelectAccount={onSelectAccount}
                                        />
                                    ))}
                                    <TotalRow
                                        label="Total Liabilities"
                                        values={(totals.liabilities_by_month || []).map(v => -v)}
                                        colorClass="text-red-600 dark:text-red-400"
                                    />
                                </>
                            )}

                            {/* Net Worth Row */}
                            <TotalRow
                                label="Net Worth"
                                values={totals.net_worth_by_month || []}
                                colorClass="text-primary dark:text-primary-light"
                                isBold={true}
                            />
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="text-xs text-text-muted dark:text-text-muted-dark text-right italic">
                Click any cell to edit. Totals auto-recalculate.
            </div>
        </div>
    );
}
