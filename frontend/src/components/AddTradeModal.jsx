import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Save, TrendingUp, TrendingDown, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import TickerSearch from './TickerSearch';
import { useAuth } from '../context/AuthContext';

/**
 * AddTradeModal
 * 
 * A modal to record a new investment trade (Buy or Sell).
 * Allows selecting trade type, date, and entering trade details.
 */
export default function AddTradeModal({ isOpen, onClose, tradeToEdit = null }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Default currency logic
    const userCurrency = user?.currency_symbol?.replace('$', '') || 'AUD';

    // --- State ---
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [form, setForm] = useState({
        ticker: '',
        name: '',
        trade_type: 'BUY',
        trade_date: new Date().toISOString().split('T')[0], // Today's date
        quantity: '',
        price: '',
        fees: '0',
        currency: userCurrency,
        exchange_rate: 1.0,
        notes: ''
    });

    // Populate form if tradeToEdit is provided
    useEffect(() => {
        if (tradeToEdit) {
            setSelectedAccountId(tradeToEdit.account_id);
            setForm({
                ticker: tradeToEdit.ticker,
                name: tradeToEdit.name,
                trade_type: tradeToEdit.trade_type,
                trade_date: tradeToEdit.trade_date, // Assumes YYYY-MM-DD
                quantity: tradeToEdit.quantity,
                price: tradeToEdit.price,
                fees: tradeToEdit.fees,
                currency: tradeToEdit.currency,
                exchange_rate: tradeToEdit.exchange_rate,
                notes: tradeToEdit.notes || ''
            });
        } else {
            // Reset if opening new
            // Note: This might conflict if modal stays mounted, parent should handle key/state
        }
    }, [tradeToEdit, isOpen]);

    // Update form default currency when user loads
    useEffect(() => {
        if (!tradeToEdit && userCurrency && form.currency === 'USD' && !form.ticker) {
            setForm(prev => ({ ...prev, currency: userCurrency }));
        }
    }, [userCurrency, tradeToEdit]);

    // --- Queries ---

    // Fetch Investment Accounts only
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['investment-accounts'],
        queryFn: async () => {
            const res = await api.get('/net-worth/accounts');
            // Filter for Investment category
            return res.data.filter(acc => acc.category === 'Investment');
        },
        enabled: isOpen
    });

    // Auto-select first account if only one exists (only for CREATE mode)
    useEffect(() => {
        if (!tradeToEdit && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId, tradeToEdit]);

    // --- Mutations ---

    const createTradeMutation = useMutation({
        mutationFn: async (data) => {
            await api.post(`/net-worth/accounts/${selectedAccountId}/trades`, data);
        },
        onSuccess: () => {
            invalidateQueries();
            resetForm();
            onClose();
        },
        onError: (err) => {
            console.error("Failed to create trade:", err);
            alert(err.response?.data?.detail || "Failed to record trade");
        }
    });

    const updateTradeMutation = useMutation({
        mutationFn: async (data) => {
            await api.put(`/net-worth/trades/${tradeToEdit.id}`, data);
        },
        onSuccess: () => {
            invalidateQueries();
            resetForm();
            onClose();
        },
        onError: (err) => {
            console.error("Failed to update trade:", err);
            alert(err.response?.data?.detail || "Failed to update trade");
        }
    });

    const invalidateQueries = () => {
        queryClient.invalidateQueries(['investments-portfolio']);
        queryClient.invalidateQueries(['investments-allocation']);
        queryClient.invalidateQueries(['investments-holdings']);
        queryClient.invalidateQueries(['investments-history']);
        queryClient.invalidateQueries(['holdings', selectedAccountId]);
        queryClient.invalidateQueries(['trades', selectedAccountId]);
        if (form.ticker) queryClient.invalidateQueries(['trades', form.ticker]); // Specific ticker trades
    };

    // --- Helpers ---

    const resetForm = () => {
        setForm({
            ticker: '',
            name: '',
            trade_type: 'BUY',
            trade_date: new Date().toISOString().split('T')[0],
            quantity: '',
            price: '',
            fees: '0',
            currency: userCurrency,
            exchange_rate: 1.0,
            notes: ''
        });
        if (!tradeToEdit) setSelectedAccountId(null);
    };

    const handleTickerSelect = (data) => {
        setForm(prev => ({
            ...prev,
            ticker: data.ticker,
            name: data.name || '',
            price: data.price?.toFixed(2) || prev.price,
            currency: data.currency || userCurrency,
            exchange_rate: 1.0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedAccountId) return;

        const payload = {
            ticker: form.ticker,
            name: form.name,
            trade_type: form.trade_type,
            trade_date: form.trade_date,
            quantity: parseFloat(form.quantity),
            price: parseFloat(form.price),
            fees: parseFloat(form.fees) || 0,
            currency: form.currency,
            exchange_rate: parseFloat(form.exchange_rate),
            notes: form.notes || null
        };

        if (tradeToEdit) {
            updateTradeMutation.mutate(payload);
        } else {
            createTradeMutation.mutate(payload);
        }
    };

    const tradeType = form.trade_type;
    const isBuy = tradeType === 'BUY';
    const isSell = tradeType === 'SELL';
    const isDividend = tradeType === 'DIVIDEND';
    const isDrip = tradeType === 'DRIP';
    const isEditing = !!tradeToEdit;

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
                                        {isEditing ? 'Edit Trade' : 'Add Trade'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark focus:outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Account Selection (Read Only if Editing) */}
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
                                        ) : isEditing ? (
                                            <div className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-muted cursor-not-allowed">
                                                {accounts.find(a => a.id === selectedAccountId)?.name || 'Unknown Account'}
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

                                    {/* Trade Type Toggle */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
                                            Trade Type
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, trade_type: 'BUY' }))}
                                                className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${isBuy
                                                    ? 'border-accent-success bg-accent-success/10 text-accent-success'
                                                    : 'border-border dark:border-border-dark text-text-muted hover:border-accent-success/50'
                                                    }`}
                                            >
                                                <TrendingUp size={20} />
                                                <span className="text-sm font-medium">Buy</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, trade_type: 'SELL' }))}
                                                className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${isSell
                                                    ? 'border-accent-error bg-accent-error/10 text-accent-error'
                                                    : 'border-border dark:border-border-dark text-text-muted hover:border-accent-error/50'
                                                    }`}
                                            >
                                                <TrendingDown size={20} />
                                                <span className="text-sm font-medium">Sell</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, trade_type: 'DIVIDEND' }))}
                                                className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${isDividend
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border dark:border-border-dark text-text-muted hover:border-primary/50'
                                                    }`}
                                            >
                                                <DollarSign size={20} />
                                                <span className="text-sm font-medium">Dividend</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, trade_type: 'DRIP' }))}
                                                className={`flex flex-col items-center justify-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${isDrip
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border dark:border-border-dark text-text-muted hover:border-primary/50'
                                                    }`}
                                            >
                                                <RefreshCw size={20} />
                                                <span className="text-sm font-medium">DRIP</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ticker Search */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Ticker Symbol
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={form.ticker}
                                                    readOnly
                                                    className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-muted cursor-not-allowed"
                                                />
                                            ) : (
                                                <TickerSearch
                                                    value={form.ticker}
                                                    onChange={(val) => setForm(prev => ({ ...prev, ticker: val }))}
                                                    onSelect={handleTickerSelect}
                                                />
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Asset Name
                                            </label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                readOnly={isEditing}
                                                onChange={isEditing ? (e) => setForm(prev => ({ ...prev, name: e.target.value })) : undefined}
                                                className={`w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg ${!isEditing ? 'text-text-muted cursor-not-allowed' : 'text-text-primary'}`}
                                                placeholder="Auto-filled from ticker..."
                                            />
                                        </div>

                                        {/* Trade Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    Trade Date
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={form.trade_date}
                                                onChange={(e) => setForm(prev => ({ ...prev, trade_date: e.target.value }))}
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
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
                                                Price per Unit ({form.currency})
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

                                        {/* Fees */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Fees ({form.currency})
                                                <span className="text-xs font-normal text-text-muted ml-2">(optional)</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.fees}
                                                onChange={(e) => setForm(prev => ({ ...prev, fees: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Notes
                                                <span className="text-xs font-normal text-text-muted ml-2">(optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.notes}
                                                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="e.g., DCA purchase, rebalancing..."
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Total Value Preview */}
                                    {form.quantity && form.price && (
                                        <div className={`p-3 rounded-lg border ${isBuy || isDrip ? 'bg-accent-success/5 border-accent-success/20'
                                            : isSell ? 'bg-accent-error/5 border-accent-error/20'
                                                : 'bg-primary/5 border-primary/20'
                                            }`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                                    {isBuy ? 'Total Cost' : isSell ? 'Total Proceeds' : isDividend ? 'Dividend Amount' : 'DRIP Value'}
                                                </span>
                                                <span className={`text-lg font-bold ${isBuy || isDrip ? 'text-accent-success'
                                                    : isSell ? 'text-accent-error'
                                                        : 'text-primary'
                                                    }`}>
                                                    {form.currency} {((parseFloat(form.quantity) * parseFloat(form.price)) + (parseFloat(form.fees) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

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
                                            disabled={createTradeMutation.isPending || updateTradeMutation.isPending || !selectedAccountId}
                                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${isBuy || isDrip ? 'bg-accent-success hover:bg-accent-success/90 focus:ring-accent-success'
                                                : isSell ? 'bg-accent-error hover:bg-accent-error/90 focus:ring-accent-error'
                                                    : 'bg-primary hover:bg-primary/90 focus:ring-primary'
                                                }`}
                                        >
                                            {(createTradeMutation.isPending || updateTradeMutation.isPending) ? (
                                                <>{isEditing ? 'Updating...' : 'Recording...'}</>
                                            ) : (
                                                <>
                                                    {isBuy && <TrendingUp size={16} />}
                                                    {isSell && <TrendingDown size={16} />}
                                                    {isDividend && <DollarSign size={16} />}
                                                    {isDrip && <RefreshCw size={16} />}
                                                    {isEditing ? 'Update Trade' : `Record ${isBuy ? 'Buy' : isSell ? 'Sell' : isDividend ? 'Dividend' : 'DRIP'}`}
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
