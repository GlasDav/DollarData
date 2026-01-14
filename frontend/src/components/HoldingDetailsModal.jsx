import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Trash2, Edit2, TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { SkeletonBox as Skeleton } from './Skeleton';

export default function HoldingDetailsModal({ isOpen, onClose, holding, onEditTrade }) {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState(null);

    // --- Queries ---
    const { data: trades = [], isLoading } = useQuery({
        queryKey: ['trades', holding?.ticker],
        queryFn: async () => {
            if (!holding) return [];
            const res = await api.get(`/net-worth/accounts/${holding.account_id}/trades/${holding.ticker}`);
            return res.data;
        },
        enabled: isOpen && !!holding
    });

    // --- Mutations ---
    const deleteTradeMutation = useMutation({
        mutationFn: async (tradeId) => {
            await api.delete(`/net-worth/trades/${tradeId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['trades', holding?.ticker]);
            queryClient.invalidateQueries(['investments-holdings']);
            queryClient.invalidateQueries(['investments-portfolio']);
            queryClient.invalidateQueries(['investments-history']);
            // If holding is deleted (qty 0), we might need to close modal or handle it. 
            // For now, list will just empty or holding prop might become stale.
        },
        onError: (err) => {
            alert("Failed to delete trade: " + (err.response?.data?.detail || err.message));
        }
    });

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this trade? This will recalculate your holding's cost basis.")) {
            setDeletingId(id);
            deleteTradeMutation.mutate(id, {
                onSettled: () => setDeletingId(null)
            });
        }
    };

    // --- Helpers ---
    const formatCurrency = (val, currency) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(val);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'BUY': return <TrendingUp size={16} className="text-accent-success" />;
            case 'SELL': return <TrendingDown size={16} className="text-accent-error" />;
            case 'DIVIDEND': return <DollarSign size={16} className="text-primary" />;
            case 'DRIP': return <RefreshCw size={16} className="text-primary" />;
            default: return null;
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-card dark:bg-card-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                                <div className="flex justify-between items-start mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                                            {holding?.ticker?.[0]}
                                        </div>
                                        <span>{holding?.name} ({holding?.ticker})</span>
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark focus:outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto -mx-6 px-6 max-h-[60vh] overflow-y-auto">
                                    {isLoading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                        </div>
                                    ) : trades.length === 0 ? (
                                        <div className="text-center py-12 text-text-muted">
                                            No trades found for this holding.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-surface dark:bg-surface-dark text-text-muted dark:text-text-muted-dark text-xs uppercase font-medium sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3 text-right">Qty</th>
                                                    <th className="px-4 py-3 text-right">Price</th>
                                                    <th className="px-4 py-3 text-right">Value</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                                {trades.map((t) => (
                                                    <tr key={t.id} className="hover:bg-surface dark:hover:bg-surface-dark/50 group">
                                                        <td className="px-4 py-3 text-sm text-text-secondary dark:text-text-secondary-dark whitespace-nowrap">
                                                            {new Date(t.trade_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="flex items-center gap-2 font-medium">
                                                                {getIcon(t.trade_type)}
                                                                <span className={
                                                                    t.trade_type === 'BUY' ? 'text-accent-success' :
                                                                        t.trade_type === 'SELL' ? 'text-accent-error' :
                                                                            'text-primary'
                                                                }>{t.trade_type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-text-primary dark:text-text-primary-dark font-mono">
                                                            {t.quantity > 0 ? t.quantity.toLocaleString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-text-secondary dark:text-text-secondary-dark">
                                                            {formatCurrency(t.price, t.currency)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-text-primary dark:text-text-primary-dark">
                                                            {formatCurrency(t.total_value, t.currency)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => onEditTrade(t)}
                                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(t.id)}
                                                                    disabled={deletingId === t.id}
                                                                    className="p-1.5 text-text-muted hover:text-accent-error hover:bg-accent-error/10 rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Delete"
                                                                >
                                                                    {deletingId === t.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
