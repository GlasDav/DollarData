import React, { useState, useEffect } from 'react';
import { toLocalISOString } from '../utils/dateUtils';
import { X, Calendar, DollarSign, Tag, User, AlignLeft, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Button from './ui/Button';

export default function CreateTransactionModal({ isOpen, onClose, members, bucketsTree }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        date: toLocalISOString(new Date()),
        description: '',
        amount: '',
        bucket_id: '',
        spender: 'Joint',
        is_verified: true,
        notes: '',
        type: 'expense' // 'expense' or 'income'
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: toLocalISOString(new Date()),
                description: '',
                amount: '',
                bucket_id: '',
                spender: 'Joint',
                is_verified: true,
                notes: '',
                type: 'expense'
            });
        }
    }, [isOpen]);

    const [shouldClose, setShouldClose] = useState(true);

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const absAmount = Math.abs(parseFloat(data.amount));
            const finalAmount = data.type === 'expense' ? -absAmount : absAmount;

            const payload = {
                ...data,
                amount: finalAmount,
                bucket_id: data.bucket_id ? parseInt(data.bucket_id) : null,
                raw_description: data.description
            };
            await api.post('/transactions/', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            queryClient.invalidateQueries(['recentTransactions']);
            if (shouldClose) {
                onClose();
            } else {
                // Reset form but keep Date and Spender for convenience
                setFormData(prev => ({
                    ...prev,
                    description: '',
                    amount: '',
                    notes: '',
                    // Keep date, bucket, spender, type, verified status
                }));
                // Focus description input if possible (ref would be better but this is quick)
                const descInput = document.querySelector('input[placeholder="e.g. Woolworths Groceries"]');
                if (descInput) descInput.focus();
            }
        },
        onError: (err) => {
            console.error("Failed to create transaction:", err);
            alert("Failed to create transaction. Please check your inputs.");
        }
    });

    const handleSubmit = (e, closeOnSuccess = true) => {
        if (e) e.preventDefault();
        setShouldClose(closeOnSuccess);

        if (!formData.description || !formData.amount) {
            alert("Description and Amount are required.");
            return;
        }
        createMutation.mutate(formData);
    };

    if (!isOpen) return null;

    // Helper to render hierarchical categories
    const renderCategoryOptions = (nodes) => {
        if (!nodes) return null;
        return nodes.map(node => {
            if (node.children && node.children.length > 0) {
                return (
                    <optgroup key={node.id} label={node.name}>
                        {renderCategoryOptions(node.children)}
                    </optgroup>
                );
            }
            return <option key={node.id} value={node.id}>{node.name}</option>;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border dark:border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">Add Transaction</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Type Toggle */}
                    <div className="flex p-1 bg-surface dark:bg-surface-dark rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${formData.type === 'expense'
                                ? 'bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark shadow-sm'
                                : 'text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'income' })}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${formData.type === 'income'
                                ? 'bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark shadow-sm'
                                : 'text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark'}`}
                        >
                            Income
                        </button>
                    </div>

                    {/* Date & Amount Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none transition"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none transition font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input
                                type="text"
                                required
                                placeholder="e.g. Woolworths Groceries"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <select
                                value={formData.bucket_id}
                                onChange={e => setFormData({ ...formData, bucket_id: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none transition appearance-none cursor-pointer"
                            >
                                <option value="">Uncategorized</option>
                                {renderCategoryOptions(bucketsTree)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-xs">▼</div>
                        </div>
                    </div>

                    {/* Spender & Verified */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Spender</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                <select
                                    value={formData.spender}
                                    onChange={e => setFormData({ ...formData, spender: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-sm text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none transition appearance-none cursor-pointer"
                                >
                                    <option value="Joint">Joint</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.name}>{m.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-xs">▼</div>
                            </div>
                        </div>

                        {/* Verified Toggle */}
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${formData.is_verified ? 'bg-primary border-primary' : 'border-input dark:border-border-dark'}`}>
                                    {formData.is_verified && <CheckCircle size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.is_verified}
                                    onChange={e => setFormData({ ...formData, is_verified: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-text-muted group-hover:text-primary transition">Mark as Verified</span>
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-border-dark mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark transition"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                isLoading={createMutation.isPending}
                                onClick={() => handleSubmit(null, false)}
                            >
                                Create & Add Another
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={createMutation.isPending}
                                icon={CheckCircle}
                            >
                                Create Transaction
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
