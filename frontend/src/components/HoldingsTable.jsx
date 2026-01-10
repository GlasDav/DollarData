import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Save, X, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import TickerSearch from './TickerSearch';

// Currency Code to Symbol Map
const CURRENCY_MAP = {
    'USD': '$',
    'AUD': 'A$',
    'GBP': '£',
    'EUR': '€',
    'JPY': '¥',
    'INR': '₹',
    'CAD': 'C$',
};

/**
 * Format a number as currency with the given currency code
 */
const formatCurrency = (amount, currency = 'USD') => {
    const symbol = CURRENCY_MAP[currency] || '$';
    return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

/**
 * Format a number for display (quantity, price)
 */
const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * HoldingsTable - A clean implementation with optimistic updates
 * for instant UI feedback when adding/editing/deleting holdings.
 */
const HoldingsTable = ({ accountId }) => {
    const queryClient = useQueryClient();
    const queryKey = ['holdings', accountId];

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [form, setForm] = useState({
        ticker: '',
        name: '',
        quantity: '',
        price: '',
        cost_basis: '',
        currency: 'USD',
        exchange_rate: 1.0
    });

    // Fetch holdings
    const { data: holdings = [], isLoading } = useQuery({
        queryKey,
        queryFn: () => api.getHoldings(accountId),
        enabled: !!accountId
    });

    // Fetch user settings for system currency
    const { data: userSettings } = useQuery({
        queryKey: ['userSettings'],
        queryFn: api.getSettings
    });

    const systemCurrency = userSettings?.currency_symbol || 'USD';

    // Reset form
    const resetForm = () => {
        setForm({
            ticker: '',
            name: '',
            quantity: '',
            price: '',
            cost_basis: '',
            currency: 'USD',
            exchange_rate: 1.0
        });
        setIsFormOpen(false);
        setEditingId(null);
    };

    // === CREATE MUTATION with Optimistic Update ===
    const createMutation = useMutation({
        mutationFn: (data) => api.createHolding(accountId, data),
        onMutate: async (newHolding) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);

            // Optimistic add with temp ID
            const optimistic = {
                ...newHolding,
                id: Date.now(), // temp ID
                value: newHolding.quantity * newHolding.price * newHolding.exchange_rate
            };
            queryClient.setQueryData(queryKey, old => [...(old || []), optimistic]);

            return { previous };
        },
        onError: (err, newHolding, context) => {
            queryClient.setQueryData(queryKey, context.previous);
            console.error('Create failed:', err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // === UPDATE MUTATION with Optimistic Update ===
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateHolding(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, old =>
                old.map(h => h.id === id ? {
                    ...h,
                    ...data,
                    value: data.quantity * data.price * data.exchange_rate
                } : h)
            );

            return { previous };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(queryKey, context.previous);
            console.error('Update failed:', err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // === DELETE MUTATION with Optimistic Update ===
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteHolding(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);

            // Optimistically remove
            queryClient.setQueryData(queryKey, old => old.filter(h => h.id !== id));

            return { previous };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(queryKey, context.previous);
            console.error('Delete failed:', err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ticker: form.ticker,
            name: form.name,
            quantity: parseFloat(form.quantity) || 0,
            price: parseFloat(form.price) || 0,
            cost_basis: parseFloat(form.cost_basis) || 0,
            currency: form.currency,
            exchange_rate: parseFloat(form.exchange_rate) || 1.0
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }

        resetForm();
    };

    // Start editing
    const startEdit = (holding) => {
        setEditingId(holding.id);
        setForm({
            ticker: holding.ticker,
            name: holding.name,
            quantity: holding.quantity.toString(),
            price: holding.price?.toFixed(2) || '',
            cost_basis: (holding.cost_basis || 0).toFixed(2),
            currency: holding.currency || 'USD',
            exchange_rate: holding.exchange_rate || 1.0
        });
        setIsFormOpen(true);
    };

    // Handle delete
    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    // Handle ticker select from search
    const handleTickerSelect = (data) => {
        setForm(prev => ({
            ...prev,
            ticker: data.ticker,
            name: data.name || '',
            price: data.price?.toFixed(2) || prev.price,
            currency: data.currency || 'USD',
            exchange_rate: data.exchange_rate || 1.0
        }));
    };

    // Calculate total portfolio value in system currency
    const totalValueInSystemCurrency = holdings.reduce((sum, h) => {
        // h.value is already in system currency (USD) based on backend logic
        return sum + (h.value || 0);
    }, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">Holdings</h3>
                    {holdings.length > 0 && (
                        <p className="text-sm text-text-muted">
                            Portfolio Value: <span className="font-semibold text-text-primary dark:text-text-primary-dark">
                                {formatCurrency(totalValueInSystemCurrency, systemCurrency)}
                            </span>
                        </p>
                    )}
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => { resetForm(); setIsFormOpen(true); }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-lg transition"
                    >
                        <Plus size={16} />
                        Add Holding
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-surface dark:bg-surface-dark p-4 rounded-xl border border-border dark:border-border-dark space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* Ticker */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Ticker</label>
                            <TickerSearch
                                value={form.ticker}
                                onChange={(val) => setForm(prev => ({ ...prev, ticker: val }))}
                                onSelect={handleTickerSelect}
                            />
                        </div>

                        {/* Name (read-only) */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Name</label>
                            <input
                                className="w-full mt-1 px-3 py-2 rounded-lg border-0 text-sm bg-card dark:bg-card-dark text-text-muted"
                                value={form.name}
                                readOnly
                                placeholder="Auto-filled from ticker"
                            />
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase">Quantity</label>
                            <input
                                type="number"
                                step="any"
                                className="w-full mt-1 px-3 py-2 rounded-lg border-0 text-sm focus:ring-2 focus:ring-primary bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark"
                                value={form.quantity}
                                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Price (read-only) */}
                        <div>
                            <label className="text-xs font-bold text-text-muted uppercase">Price</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full mt-1 px-3 py-2 rounded-lg border-0 text-sm bg-card dark:bg-card-dark text-text-muted"
                                value={form.price}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary-hover rounded-lg flex items-center gap-2"
                        >
                            <Save size={16} />
                            {editingId ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            {/* Holdings Table */}
            {holdings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border dark:border-border-dark rounded-xl">
                    <p className="text-text-muted">No holdings tracked yet.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border dark:border-border-dark">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface dark:bg-surface-dark text-text-muted border-b border-border dark:border-border-dark">
                            <tr>
                                <th className="px-4 py-3 font-bold">Ticker</th>
                                <th className="px-4 py-3 font-bold">Name</th>
                                <th className="px-4 py-3 font-bold text-right">Qty</th>
                                <th className="px-4 py-3 font-bold text-right">Price</th>
                                <th className="px-4 py-3 font-bold text-right">Value ({systemCurrency})</th>
                                <th className="px-4 py-3 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {holdings.map(h => (
                                <tr key={h.id} className="hover:bg-surface dark:hover:bg-surface-dark/50 transition">
                                    <td className="px-4 py-3 font-bold text-text-secondary dark:text-text-secondary-dark">{h.ticker}</td>
                                    <td className="px-4 py-3 text-text-secondary dark:text-text-secondary-dark max-w-[200px] truncate">{h.name}</td>
                                    <td className="px-4 py-3 text-right text-text-secondary dark:text-text-secondary-dark tabular-nums">
                                        {formatNumber(h.quantity, h.quantity % 1 !== 0 ? 4 : 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-secondary dark:text-text-secondary-dark tabular-nums">
                                        {formatCurrency(h.price || 0, h.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-text-primary dark:text-text-primary-dark tabular-nums">
                                        {formatCurrency(h.value || 0, systemCurrency)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => startEdit(h)}
                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(h.id)}
                                                className="p-1.5 text-text-muted hover:text-accent-error hover:bg-accent-error/10 dark:hover:bg-accent-error/20 rounded transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr className="bg-surface dark:bg-surface-dark font-bold">
                                <td colSpan={4} className="px-4 py-3 text-right text-text-secondary dark:text-text-secondary-dark">
                                    Total Portfolio Value
                                </td>
                                <td className="px-4 py-3 text-right text-lg text-primary dark:text-primary-dark tabular-nums">
                                    {formatCurrency(totalValueInSystemCurrency, systemCurrency)}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HoldingsTable;
