import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getBucketsTree, getSettings, getGoals, deleteAllTransactions, getMembers } from '../services/api';
import { Trash2, Search, Filter, Pencil, Split, UploadCloud, FileText, Loader2, ChevronDown, ArrowUp, ArrowDown, X, BookPlus, UserCheck, StickyNote, Plus } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import TransactionNoteModal from '../components/TransactionNoteModal';
import SplitTransactionModal from '../components/SplitTransactionModal';
import CreateRuleModal from '../components/CreateRuleModal';
import EmptyState from '../components/EmptyState';
import CreateTransactionModal from '../components/CreateTransactionModal';
import Button from '../components/ui/Button';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// ... imports
import FilterPill from '../components/ui/FilterPill';
import CategoryFilterContent from '../components/filters/CategoryFilterContent';
import SpenderFilterContent from '../components/filters/SpenderFilterContent';
import CategorySelectOptions from '../components/filters/CategorySelectOptions';
import SortHeader from '../components/ui/SortHeader';

export default function Transactions() {
    // ... (state remains same)

    // ... (logic remains same)

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortDir("desc");
        }
    };

    const activeFiltersCount = [categoryFilter, spenderFilter, debouncedSearch].filter(Boolean).length;

    const clearAllFilters = () => {
        setSearch("");
        setCategoryFilter(null);
        setSpenderFilter(null);
        setSearchParams({});
    };

    // Removed inline SortHeader and renderCategoryOptions

    return (
        <div className="w-full px-4 py-8 space-y-6">
            <header className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">Transactions</h1>
                        <p className="text-text-muted dark:text-text-muted-dark mt-2">
                            {totalCount > 0 ? `${totalCount.toLocaleString()} transactions` : 'Manage your complete transaction history.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition shadow-sm hover:shadow active:scale-95"
                        >
                            <Plus size={18} />
                            <span>Add</span>
                        </button>

                        <Link to="/data-management">
                            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium transition active:scale-95">
                                <UploadCloud size={18} />
                                <span>Import</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-wrap items-center gap-3 bg-card dark:bg-card-dark rounded-xl p-3 border border-border dark:border-border-dark shadow-sm">
                    {/* Search Input */}
                    <div className="relative min-w-[240px] md:w-auto flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-input dark:border-border-dark bg-surface dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
// ... imports
                    import TransactionRow from '../components/TransactionRow';

                    // ...

                    // Fetch Transactions with filters
                    const {data: transactionData, isLoading } = useQuery({
                        queryKey: ['transactions', debouncedSearch, categoryFilter, spenderFilter, monthParam, yearParam, sortBy, sortDir],
        queryFn: async () => {
            const params = {limit: 100 }; // Reduce limit to improve initial load performance
                    if (debouncedSearch) params.search = debouncedSearch;
                    if (categoryFilter) params.bucket_id = categoryFilter;
                    if (spenderFilter) params.spender = spenderFilter;
                    if (monthParam) params.month = monthParam;
                    if (yearParam) params.year = yearParam;
                    if (sortBy) params.sort_by = sortBy;
                    if (sortDir) params.sort_dir = sortDir;

                    const res = await api.get('/transactions/', {params});
                    return res.data;
        }
    });

                    // ... inside render ...

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

                    {/* Filter Pills */}
                    <FilterPill
// ...

                        <tbody className="divide-y divide-border dark:divide-border-dark">
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-primary" size={32} />
                                        <span className="text-text-muted">Loading transactions...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-8 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="text-text-muted" size={24} />
                                        <span className="text-text-muted font-medium">No transactions match your search</span>
                                        <button
                                            onClick={() => setSearch('')}
                                            className="text-primary text-sm hover:text-primary-hover"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((txn) => (
                                <TransactionRow
                                    key={txn.id}
                                    txn={txn}
                                    selectedIds={selectedIds}
                                    editingCell={editingCell}
                                    buckets={buckets}
                                    members={members}
                                    assignDropdownId={assignDropdownId}
                                    onToggleSelect={(id) => toggleSelect(id)}
                                    onSetEditingCell={setEditingCell}
                                    onUpdate={(data) => updateMutation.mutate(data)}
                                    onSplit={() => { setTransactionToSplit(txn); setSplitModalOpen(true); }}
                                    onNote={() => { setTransactionForNote(txn); setNoteModalOpen(true); }}
                                    onRule={() => { setTransactionForRule(txn); setRuleModalOpen(true); }}
                                    onAssignDropdown={setAssignDropdownId}
                                    onAssign={(data) => updateMutation.mutate(data)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
        </div>
    )
}
{/* Sticky Action Bar */ }
{
    selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-card dark:bg-card-dark px-6 py-3 rounded-2xl shadow-2xl border border-border dark:border-border-dark animate-slide-up">
            <div className="flex items-center gap-2 border-r border-border dark:border-border-dark pr-4">
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedIds.size}
                </span>
                <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Selected</span>
            </div>

            <div className="flex items-center gap-3">
                {/* Bulk Category */}
                <div className="relative group">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                batchUpdateMutation.mutate({
                                    ids: Array.from(selectedIds),
                                    bucket_id: parseInt(e.target.value)
                                });
                                e.target.value = "";
                            }
                        }}
                        className="appearance-none pl-3 pr-8 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark hover:border-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                        disabled={batchUpdateMutation.isPending}
                    >
                        <option value="">In Category...</option>
                        <CategorySelectOptions buckets={buckets} />
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>

                {/* Bulk Spender */}
                <div className="relative group">
                    <select
                        onChange={(e) => {
                            if (e.target.value) {
                                batchUpdateMutation.mutate({
                                    ids: Array.from(selectedIds),
                                    spender: e.target.value
                                });
                                e.target.value = "";
                            }
                        }}
                        className="appearance-none pl-3 pr-8 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark hover:border-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                        disabled={batchUpdateMutation.isPending}
                    >
                        <option value="">By Whom...</option>
                        <option value="Joint" className="dark:bg-card-dark dark:text-text-primary-dark">Joint</option>
                        {members.map(member => (
                            <option key={member.id} value={member.name} className="dark:bg-card-dark dark:text-text-primary-dark">{member.name}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
            </div>

            <div className="border-l border-border dark:border-border-dark pl-4 flex items-center gap-2">
                <button
                    onClick={() => setSelectedIds(new Set())}
                    className="p-2 text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark transition"
                    title="Clear Selection"
                >
                    <X size={18} />
                </button>
                <button
                    onClick={() => {
                        if (window.confirm(`Delete ${selectedIds.size} transactions?`)) {
                            deleteBatchMutation.mutate(Array.from(selectedIds));
                        }
                    }}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    title="Delete Selected"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    )
}
        </div >
    );
}

