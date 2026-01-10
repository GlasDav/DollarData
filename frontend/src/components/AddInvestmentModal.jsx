import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Save, ChevronsUpDown, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; // Ensure this path is correct for api import
import TickerSearch from './TickerSearch';

import { useAuth } from '../context/AuthContext';

/**
 * AddInvestmentModal
 * 
 * A modal to add a new investment holding. 
 * Allows selecting the target account and entering holding details.
 */
export default function AddInvestmentModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Default currency logic
    const userCurrency = user?.currency_symbol?.replace('$', '') || 'AUD';

    // --- State ---
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [form, setForm] = useState({
        ticker: '',
        name: '',
        quantity: '',
        price: '',
        cost_basis: '',
        currency: userCurrency,
        exchange_rate: 1.0
    });

    // Update form default currency when user loads
    useEffect(() => {
        if (userCurrency && form.currency === 'USD' && !form.ticker) {
            setForm(prev => ({ ...prev, currency: userCurrency }));
        }
    }, [userCurrency]);

    // --- Queries ---

    // Fetch Investment Accounts only
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['investment-accounts'],
        queryFn: async () => {
            const res = await api.get('/net-worth/accounts');
            // Filter for Investment category
            return res.data.filter(acc => acc.category === 'Investment');
        },
        enabled: isOpen // Only fetch when open
    });

    // Auto-select first account if only one exists
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // --- Mutations ---

    const createHoldingMutation = useMutation({
        mutationFn: async (data) => {
            await api.post(`/net-worth/holdings/${selectedAccountId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['investments-portfolio']);
            queryClient.invalidateQueries(['investments-allocation']);
            queryClient.invalidateQueries(['investments-holdings']); // The main table
            queryClient.invalidateQueries(['investments-history']);
            queryClient.invalidateQueries(['holdings', selectedAccountId]); // Specific account holdings
            resetForm();
            onClose();
        },
        onError: (err) => {
            console.error("Failed to create holding:", err);
        }
    });

    // --- Helpers ---

    const resetForm = () => {
        setForm({
            ticker: '',
            name: '',
            quantity: '',
            price: '',
            cost_basis: '',
            currency: userCurrency,
            exchange_rate: 1.0
        });
    };

    const handleTickerSelect = (data) => {
        setForm(prev => ({
            ...prev,
            ticker: data.ticker,
            name: data.name || '',
            price: data.price?.toFixed(2) || prev.price,
            // Respect Ticker currency for Price/Cost entry, but fallback to User Currency if missing
            currency: data.currency || userCurrency,
            exchange_rate: 1.0 // Reset to 1.0, backend will calculate if needed
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedAccountId) return;

        createHoldingMutation.mutate({
            ticker: form.ticker,
            name: form.name,
            quantity: parseFloat(form.quantity),
            price: parseFloat(form.price),
            cost_basis: parseFloat(form.cost_basis),
            currency: form.currency,
            exchange_rate: parseFloat(form.exchange_rate)
        });
    };

    // --- Render ---

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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card dark:bg-card-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                                <div className="flex justify-between items-start mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-text-primary dark:text-text-primary-dark">
                                        Add Investment
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark focus:outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Account Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                            Investment Account
                                        </label>
                                        {loadingAccounts ? (
                                            <div className="h-10 bg-surface dark:bg-surface-dark rounded-lg animate-pulse" />
                                        ) : accounts.length === 0 ? (
                                            <div className="p-3 text-sm text-accent-error bg-accent-error/10 dark:bg-accent-error/20 rounded-lg border border-accent-error/20 dark:border-accent-error/30">
                                                No investment accounts found. Please create one in Net Worth page first.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedAccountId || ''}
                                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                                                required
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            >
                                                <option value="" disabled>Select an account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Ticker Search */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Ticker Symbol
                                            </label>
                                            <TickerSearch
                                                value={form.ticker}
                                                onChange={(val) => setForm(prev => ({ ...prev, ticker: val }))}
                                                onSelect={handleTickerSelect}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Asset Name
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                readOnly
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-muted cursor-not-allowed"
                                                placeholder="Auto-filled from ticker..."
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={form.quantity}
                                                onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Current Price ({form.currency})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={form.price}
                                                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>

                                        {/* Cost Basis */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Total Cost Basis ({form.currency})
                                                <span className="text-xs font-normal text-text-muted ml-2">(Total amount you paid)</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={form.cost_basis}
                                                onChange={(e) => setForm(prev => ({ ...prev, cost_basis: e.target.value }))}
                                                placeholder="e.g. 5000.00"
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg hover:bg-surface-hover dark:hover:bg-surface-dark-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createHoldingMutation.isPending || !selectedAccountId}
                                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {createHoldingMutation.isPending ? (
                                                <>Saving...</>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Add Investment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
