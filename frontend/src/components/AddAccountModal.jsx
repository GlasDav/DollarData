import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Category options based on account type
const ASSET_CATEGORIES = ['Cash', 'Savings', 'Investment', 'Property', 'Superannuation', 'Crypto', 'Collectibles', 'Other'];
const LIABILITY_CATEGORIES = ['Mortgage', 'Credit Card', 'Loan', 'HECS', 'Other'];

/**
 * AddAccountModal - Modal for creating a new account.
 */
const AddAccountModal = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('Asset');
    const [category, setCategory] = useState('Cash');
    const [error, setError] = useState('');

    // Reset form when modal closes
    const handleClose = () => {
        setName('');
        setType('Asset');
        setCategory('Cash');
        setError('');
        onClose();
    };

    // Update category when type changes
    const handleTypeChange = (newType) => {
        setType(newType);
        setCategory(newType === 'Asset' ? 'Cash' : 'Loan');
    };

    const createAccountMutation = useMutation({
        mutationFn: async (newAccount) => {
            return await api.post('/net-worth/accounts', newAccount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
            queryClient.invalidateQueries(['accountsHistory']);
            queryClient.invalidateQueries(['netWorthHistory']);
            handleClose();
        },
        onError: (err) => {
            setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name.trim()) {
            setError('Account name is required.');
            return;
        }

        createAccountMutation.mutate({
            name: name.trim(),
            type,
            category
        });
    };

    const categoryOptions = type === 'Asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md bg-card dark:bg-card-dark rounded-2xl shadow-xl border border-border dark:border-border-dark">
                    {/* Header */}
                    <div className="p-6 border-b border-border dark:border-border-dark flex justify-between items-center">
                        <Dialog.Title className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
                            Add Account
                        </Dialog.Title>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-full hover:bg-surface dark:hover:bg-surface-dark transition"
                        >
                            <X size={20} className="text-text-muted" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-accent-error/10 border border-accent-error/30 rounded-lg text-accent-error text-sm">
                                {error}
                            </div>
                        )}

                        {/* Account Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                Account Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Commonwealth Savings"
                                className="w-full px-3 py-2 border border-input dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Account Type */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                                Account Type
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('Asset')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm border transition ${type === 'Asset'
                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                            : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark'
                                        }`}
                                >
                                    Asset
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('Liability')}
                                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm border transition ${type === 'Liability'
                                            ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                                            : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark'
                                        }`}
                                >
                                    Liability
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-input dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                            >
                                {categoryOptions.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createAccountMutation.isPending}
                                className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <Plus size={18} />
                                {createAccountMutation.isPending ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default AddAccountModal;
