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

export default function Transactions() {
    // ... context and state
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

    // ... fetch logic (useQuery)

    // ... mutations (update, delete)

    // ... handlers (selection, sort)

    const activeFiltersCount = [categoryFilter, spenderFilter, debouncedSearch].filter(Boolean).length;

    const clearAllFilters = () => {
        setSearch("");
        setCategoryFilter(null);
        setSpenderFilter(null);
        setSearchParams({});
    };

    const SortHeader = ({ column, children, className = "" }) => (
        <th
            className={`px-3 py-3 font-semibold text-sm text-text-secondary dark:text-text-secondary-dark cursor-pointer hover:text-primary transition select-none ${className} ${className.includes('text-right') ? 'pr-6' : ''}`}
            onClick={() => handleSort(column)}
        >
            <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                {children}
                {sortBy === column && (
                    sortDir === "asc" ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
                )}
            </div>
        </th>
    );

    // Helper to render hierarchical category options
    const renderCategoryOptions = (treeBuckets) => {
        if (!treeBuckets || treeBuckets.length === 0) return null;

        return treeBuckets.map(parent => {
            // Skip the Income parent category itself but show its children
            if (parent.name === 'Income' && parent.group === 'Income') {
                if (parent.children && parent.children.length > 0) {
                    return (
                        <optgroup key={parent.id} label="Income" className="dark:bg-slate-800 dark:text-white text-slate-900">
                            {parent.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                                <option key={child.id} value={child.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{child.name}</option>
                            ))}
                        </optgroup>
                    );
                }
                return null;
            }

            // For parents with children, render as optgroup
            if (parent.children && parent.children.length > 0) {
                return (
                    <optgroup key={parent.id} label={parent.name} className="dark:bg-slate-800 dark:text-white text-slate-900">
                        {parent.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                            <option key={child.id} value={child.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{child.name}</option>
                        ))}
                    </optgroup>
                );
            }

            // For leaf categories (no children), render as plain option
            return <option key={parent.id} value={parent.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{parent.name}</option>;
        });
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

            {/* Modals remain the same ... */}
            <SplitTransactionModal
                isOpen={splitModalOpen}
                onClose={() => setSplitModalOpen(false)}
                transaction={transactionToSplit}
                onSplitSuccess={() => queryClient.invalidateQueries(['transactions'])}
            />
            {/* Note logic ... */}
            {/* ... */}
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
                                <SortHeader column="date">Date</SortHeader>
                                <SortHeader column="description">Description</SortHeader>
                                <SortHeader column="category">Category</SortHeader>
                                <SortHeader column="spender">Who?</SortHeader>
                                <th className="px-3 py-3 font-semibold text-sm text-text-secondary dark:text-text-secondary-dark w-24">Actions</th>
                                <SortHeader column="amount" className="text-right">Amount</SortHeader>
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
                                    <tr key={txn.id} className="hover:bg-surface dark:hover:bg-surface-dark/50 transition group">
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-input text-primary focus:ring-primary"
                                                checked={selectedIds.has(txn.id)}
                                                onChange={() => toggleSelect(txn.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark font-mono" onClick={() => setEditingCell({ id: txn.id, field: 'date' })}>
                                            {editingCell.id === txn.id && editingCell.field === 'date' ? (
                                                <input
                                                    autoFocus
                                                    type="date"
                                                    defaultValue={txn.date.split('T')[0]}
                                                    onBlur={(e) => {
                                                        if (e.target.value && e.target.value !== txn.date.split('T')[0]) {
                                                            updateMutation.mutate({ id: txn.id, date: e.target.value });
                                                        }
                                                        setEditingCell({ id: null, field: null });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.currentTarget.blur();
                                                        if (e.key === 'Escape') setEditingCell({ id: null, field: null });
                                                    }}
                                                    className="bg-surface dark:bg-surface-dark border-0 rounded px-1 py-0.5 text-xs w-full focus:ring-2 focus:ring-primary"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="cursor-pointer hover:underline decoration-dashed decoration-text-muted underline-offset-4">
                                                    {new Date(txn.date).toLocaleDateString('en-AU')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-text-secondary dark:text-text-secondary-dark group/cell max-w-[400px]" onClick={() => setEditingCell({ id: txn.id, field: 'description' })}>
                                            {editingCell.id === txn.id && editingCell.field === 'description' ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    defaultValue={txn.description}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== txn.description) {
                                                            updateMutation.mutate({ id: txn.id, description: e.target.value });
                                                        }
                                                        setEditingCell({ id: null, field: null });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                        if (e.key === 'Escape') setEditingCell({ id: null, field: null });
                                                    }}
                                                    className="w-full bg-surface dark:bg-surface-dark border-0 rounded px-2 py-1 text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary font-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 cursor-pointer" title={`Original: ${txn.raw_description}`}>
                                                    <span className="font-medium text-text-primary dark:text-text-primary-dark truncate block hover:underline decoration-dashed decoration-text-muted underline-offset-4">{txn.description}</span>
                                                    <Pencil size={14} className="text-text-muted opacity-0 group-hover/cell:opacity-100 transition-opacity flex-shrink-0" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <select
                                                className="bg-transparent hover:bg-surface-hover dark:hover:bg-surface-dark-hover dark:focus:bg-card-dark rounded px-2 py-1 text-sm text-text-primary dark:text-text-primary-dark border-none focus:ring-2 focus:ring-primary cursor-pointer max-w-[250px] truncate"
                                                value={txn.bucket_id || ""}
                                                onChange={(e) => updateMutation.mutate({ id: txn.id, bucket_id: parseInt(e.target.value), is_verified: true })}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="">Uncategorized</option>
                                                {renderCategoryOptions(buckets)}
                                            </select>
                                        </td>
                                        <td className="px-3 py-3">
                                            <select
                                                className="bg-transparent hover:bg-surface-hover dark:hover:bg-surface-dark-hover dark:focus:bg-card-dark rounded px-2 py-1 text-sm text-text-primary dark:text-text-primary-dark border-none focus:ring-2 focus:ring-primary cursor-pointer max-w-[140px] truncate"
                                                value={txn.spender || "Joint"}
                                                onChange={(e) => updateMutation.mutate({ id: txn.id, spender: e.target.value })}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Joint" className="dark:bg-card-dark dark:text-text-primary-dark">Joint</option>
                                                {members.map(member => (
                                                    <option key={member.id} value={member.name} className="dark:bg-card-dark dark:text-text-primary-dark">{member.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {/* Actions Cell - Fixed Width */}
                                        <td className="px-3 py-3 w-24">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setTransactionToSplit(txn); setSplitModalOpen(true); }}
                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition"
                                                    title="Split Transaction"
                                                >
                                                    <Split size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { setTransactionForNote(txn); setNoteModalOpen(true); }}
                                                    className={`p-1.5 rounded transition ${txn.notes ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' : 'text-text-muted hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'}`}
                                                    title={txn.notes || "Add Note"}
                                                >
                                                    <StickyNote size={14} className={txn.notes ? "fill-yellow-600/20" : ""} />
                                                </button>
                                                <button
                                                    onClick={() => { setTransactionForRule(txn); setRuleModalOpen(true); }}
                                                    className="p-1.5 text-text-muted hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition"
                                                    title="Create Rule from Transaction"
                                                >
                                                    <BookPlus size={14} />
                                                </button>
                                                {members.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setAssignDropdownId(assignDropdownId === txn.id ? null : txn.id)}
                                                            className={`p-1.5 rounded transition ${txn.assigned_to ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'text-text-muted hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}
                                                            title={txn.assigned_to ? `Assigned to ${txn.assigned_to}` : 'Assign for Review'}
                                                        >
                                                            <UserCheck size={14} />
                                                        </button>
                                                        {assignDropdownId === txn.id && (
                                                            <div className="absolute top-full right-0 mt-1 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                                                                <button
                                                                    onClick={() => { updateMutation.mutate({ id: txn.id, assigned_to: '' }); setAssignDropdownId(null); }}
                                                                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover dark:hover:bg-surface-dark-hover text-text-secondary dark:text-text-secondary-dark"
                                                                >
                                                                    None
                                                                </button>
                                                                {members.map(member => (
                                                                    <button
                                                                        key={member.id}
                                                                        onClick={() => { updateMutation.mutate({ id: txn.id, assigned_to: member.name }); setAssignDropdownId(null); }}
                                                                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover dark:hover:bg-surface-dark-hover flex items-center gap-2 ${txn.assigned_to === member.name ? 'text-orange-600 font-medium' : ''}`}
                                                                    >
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }}></span>
                                                                        {member.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td
                                            className={`px-3 pr-6 py-3 text-sm font-semibold text-right cursor-pointer group/amount`}
                                            onClick={() => setEditingCell({ id: txn.id, field: 'amount' })}
                                        >
                                            {editingCell.id === txn.id && editingCell.field === 'amount' ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={Math.abs(txn.amount)}
                                                    onBlur={(e) => {
                                                        const newAmount = parseFloat(e.target.value);
                                                        // Preserve sign (expense vs income)
                                                        const originalSign = txn.amount < 0 ? -1 : 1;
                                                        const finalAmount = Math.abs(newAmount) * originalSign;

                                                        if (finalAmount !== txn.amount && !isNaN(newAmount)) {
                                                            updateMutation.mutate({ id: txn.id, amount: finalAmount });
                                                        }
                                                        setEditingCell({ id: null, field: null });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.currentTarget.blur();
                                                        if (e.key === 'Escape') setEditingCell({ id: null, field: null });
                                                    }}
                                                    className="w-24 bg-surface dark:bg-surface-dark border-0 rounded px-1 py-0.5 text-right text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={`${txn.amount < 0 ? 'text-text-primary dark:text-text-primary-dark' : 'text-emerald-600'} hover:underline decoration-dashed decoration-text-muted underline-offset-4`}>
                                                    ${Math.abs(txn.amount).toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
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
                                {renderCategoryOptions(buckets)}
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

