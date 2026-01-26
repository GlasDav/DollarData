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

import FilterPill from '../components/ui/FilterPill';
import CategoryFilterContent from '../components/filters/CategoryFilterContent';
import SpenderFilterContent from '../components/filters/SpenderFilterContent';
import CategorySelectOptions from '../components/filters/CategorySelectOptions';
import SortHeader from '../components/ui/SortHeader';
import TransactionRow from '../components/TransactionRow';

export default function Transactions() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL Params
    const bucketIdParam = searchParams.get("bucket_id");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Local state
    const [search, setSearch] = useState("");
    const [editingCell, setEditingCell] = useState({ id: null, field: null });
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modals
    const [splitModalOpen, setSplitModalOpen] = useState(false);
    const [transactionToSplit, setTransactionToSplit] = useState(null);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [transactionForNote, setTransactionForNote] = useState(null);
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [transactionForRule, setTransactionForRule] = useState(null);
    const [assignDropdownId, setAssignDropdownId] = useState(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState(bucketIdParam ? parseInt(bucketIdParam) : null);
    const [spenderFilter, setSpenderFilter] = useState(null);
    const [sortBy, setSortBy] = useState("date");
    const [sortDir, setSortDir] = useState("desc");

    // Debounced search
    const debouncedSearch = useDebounce(search, 300);

    // Helpers to get labels
    const getCategoryName = (id) => {
        if (!buckets) return "";
        const find = (items) => {
            for (const item of items) {
                if (item.id === id) return item.name;
                if (item.children) {
                    const found = find(item.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return find(buckets);
    };

    // Fetch Transactions with filters
    const { data: transactionData, isLoading } = useQuery({
        queryKey: ['transactions', debouncedSearch, categoryFilter, spenderFilter, monthParam, yearParam, sortBy, sortDir],
        queryFn: async () => {
            const params = { limit: 100 }; // Reduce limit to improve initial load performance
            if (debouncedSearch) params.search = debouncedSearch;
            if (categoryFilter) params.bucket_id = categoryFilter;
            if (spenderFilter) params.spender = spenderFilter;
            if (monthParam) params.month = monthParam;
            if (yearParam) params.year = yearParam;
            if (sortBy) params.sort_by = sortBy;
            if (sortDir) params.sort_dir = sortDir;

            const res = await api.get('/transactions/', { params });
            return res.data;
        }
    });

    const transactions = transactionData?.items || [];
    const totalCount = transactionData?.total || 0;

    // Fetch Buckets Tree
    const { data: buckets = [] } = useQuery({
        queryKey: ['bucketsTree'],
        queryFn: getBucketsTree
    });

    // Fetch User Settings
    const { data: userSettings } = useQuery({
        queryKey: ['userSettings'],
        queryFn: getSettings
    });

    // Fetch Goals
    const { data: goals = [] } = useQuery({
        queryKey: ['goals'],
        queryFn: getGoals
    });

    // Fetch Household Members
    const { data: members = [] } = useQuery({
        queryKey: ['members'],
        queryFn: getMembers
    });

    // Update Transaction
    const updateMutation = useMutation({
        mutationFn: async ({ id, bucket_id, description, date, amount, spender, goal_id, assigned_to, is_verified }) => {
            const payload = {};
            if (bucket_id !== undefined) payload.bucket_id = bucket_id;
            if (description !== undefined) payload.description = description;
            if (date !== undefined) payload.date = date;
            if (amount !== undefined) payload.amount = amount;
            if (spender !== undefined) payload.spender = spender;
            if (goal_id !== undefined) payload.goal_id = goal_id;
            if (assigned_to !== undefined) payload.assigned_to = assigned_to;
            if (is_verified !== undefined) payload.is_verified = is_verified;

            await api.put(`/transactions/${id}`, payload);
        },
        onSuccess: (data, variables) => {
            console.log('Update success:', variables);
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['recentTransactions']);
        },
        onError: (error) => {
            console.error('Update failed:', error);
            alert(`Update failed: ${error.message}`);
        }
    });

    // Batch Delete
    const deleteBatchMutation = useMutation({
        mutationFn: async (ids) => {
            // Backend expects a raw array in the body: [1, 2, 3]
            await api.post('/transactions/batch-delete', ids);
        },
        onSuccess: () => {
            setSelectedIds(new Set());
            queryClient.invalidateQueries(['transactions']);
        },
        onError: (err) => {
            console.error('Delete failed:', err);
            alert(`Failed to delete: ${err.response?.data?.detail || err.message}`);
        }
    });

    // Delete ALL Transactions
    const deleteAllMutation = useMutation({
        mutationFn: deleteAllTransactions,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['recentTransactions']);
            alert(`Successfully deleted ${data.count} transactions.`);
        },
        onError: (err) => {
            console.error('Delete all failed:', err);
            alert(`Failed to delete all: ${err.response?.data?.detail || err.message}`);
        }
    });

    // Batch Update Transactions
    const batchUpdateMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/transactions/batch-update', data);
            return res.data;
        },
        onSuccess: (data) => {
            setSelectedIds(new Set());
            queryClient.invalidateQueries(['transactions']);
        },
        onError: (err) => {
            console.error('Batch update failed:', err);
            alert(`Failed to update: ${err.response?.data?.detail || err.message}`);
        }
    });

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(transactions.map(t => t.id)));
        }
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Sort handler
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
                                <span className="hidden sm:inline">Import</span>
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

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

                    {/* Filter Pills */}
                    <FilterPill
                        label="Category"
                        value={categoryFilter ? getCategoryName(categoryFilter) : null}
                        isActive={!!categoryFilter}
                        onClear={() => setCategoryFilter(null)}
                    >
                        {({ close }) => (
                            <CategoryFilterContent
                                buckets={buckets}
                                selectedId={categoryFilter}
                                onChange={setCategoryFilter}
                                close={close}
                            />
                        )}
                    </FilterPill>

                    <FilterPill
                        label="Spender"
                        value={spenderFilter}
                        isActive={!!spenderFilter}
                        onClear={() => setSpenderFilter(null)}
                    >
                        {({ close }) => (
                            <SpenderFilterContent
                                members={members}
                                selectedSpender={spenderFilter}
                                onChange={setSpenderFilter}
                                close={close}
                            />
                        )}
                    </FilterPill>

                    {/* Clear All */}
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-text-muted hover:text-red-500 hover:underline px-2 transition-colors"
                        >
                            Clear all
                        </button>
                    )}

                    {deleteAllMutation.isPending && <span className="text-xs text-red-500 animate-pulse ml-auto">Deleting transactions...</span>}
                </div>
            </header>

            {/* Modals */}
            <SplitTransactionModal
                isOpen={splitModalOpen}
                onClose={() => setSplitModalOpen(false)}
                transaction={transactionToSplit}
                onSplitSuccess={() => queryClient.invalidateQueries(['transactions'])}
            />
            <CreateTransactionModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                members={members}
                bucketsTree={buckets}
            />
            <TransactionNoteModal
                isOpen={noteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                transaction={transactionForNote}
            />
            <CreateRuleModal
                isOpen={ruleModalOpen}
                onClose={() => setRuleModalOpen(false)}
                transaction={transactionForRule}
                buckets={buckets}
                members={members}
            />

            {/* Table */}
            {!isLoading && transactions.length === 0 ? (
                <div className="bg-card dark:bg-card-dark rounded-xl shadow-sm border border-border dark:border-border-dark py-8">
                    <EmptyState
                        icon={FileText}
                        title="No transactions found"
                        description={activeFiltersCount > 0 ? "Try adjusting your filters to see more results." : "Import your bank statements to start tracking your spending."}
                        actionText={activeFiltersCount > 0 ? "Clear Filters" : "Import Data"}
                        actionLink={activeFiltersCount > 0 ? null : "/data-management"}
                        onAction={activeFiltersCount > 0 ? clearAllFilters : null}
                    />
                </div>
            ) : (
                <div className="bg-card dark:bg-card-dark rounded-xl shadow-sm border border-border dark:border-border-dark overflow-x-auto min-h-[500px]" >
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-primary"
                                        checked={transactions.length > 0 && selectedIds.size === transactions.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <SortHeader column="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Date</SortHeader>
                                <SortHeader column="description" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Description</SortHeader>
                                <SortHeader column="category" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Category</SortHeader>
                                <SortHeader column="spender" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Who?</SortHeader>
                                <th className="px-3 py-3 font-semibold text-sm text-text-secondary dark:text-text-secondary-dark w-24">Actions</th>
                                <SortHeader column="amount" className="text-right" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Amount</SortHeader>
                            </tr>
                        </thead>
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
            )}

            {/* Sticky Action Bar */}
            {selectedIds.size > 0 && (
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
            )}
        </div>
    );
}
