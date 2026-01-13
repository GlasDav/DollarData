import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

/**
 * ImportTradesModal
 * 
 * A modal to import trades from CSV file.
 */
export default function ImportTradesModal({ isOpen, onClose }) {
    const queryClient = useQueryClient();

    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    // Fetch Investment Accounts
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['investment-accounts'],
        queryFn: async () => {
            const res = await api.get('/net-worth/accounts');
            return res.data.filter(acc => acc.category === 'Investment');
        },
        enabled: isOpen
    });

    // Auto-select first account
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setResult(null);
        }
    }, [isOpen]);

    const importMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.post(`/net-worth/accounts/${selectedAccountId}/trades/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries(['investments-portfolio']);
            queryClient.invalidateQueries(['investments-allocation']);
            queryClient.invalidateQueries(['investments-holdings']);
            queryClient.invalidateQueries(['investments-history']);
            queryClient.invalidateQueries(['trades', selectedAccountId]);
        },
        onError: (err) => {
            setResult({ error: err.response?.data?.detail || 'Import failed' });
        }
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleImport = () => {
        if (!file || !selectedAccountId) return;

        const formData = new FormData();
        formData.append('file', file);
        importMutation.mutate(formData);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/net-worth/trades/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'trades_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download template:', err);
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-card dark:bg-card-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                                <div className="flex justify-between items-start mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-text-primary dark:text-text-primary-dark">
                                        Import Trades
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark focus:outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Account Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                            Investment Account
                                        </label>
                                        {loadingAccounts ? (
                                            <div className="h-10 bg-surface dark:bg-surface-dark rounded-lg animate-pulse" />
                                        ) : accounts.length === 0 ? (
                                            <div className="p-3 text-sm text-accent-error bg-accent-error/10 rounded-lg">
                                                No investment accounts found.
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedAccountId || ''}
                                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            >
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Template Download */}
                                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                                        <div className="flex items-start gap-3">
                                            <FileSpreadsheet className="text-primary mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                                                    Need a template?
                                                </p>
                                                <p className="text-xs text-text-muted mt-1">
                                                    Download our CSV template with examples for BUY, SELL, DIVIDEND, and DRIP trades.
                                                </p>
                                                <button
                                                    onClick={handleDownloadTemplate}
                                                    className="mt-2 text-sm font-medium text-primary hover:text-primary-hover"
                                                >
                                                    Download Template →
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                            CSV File
                                        </label>
                                        <div className="border-2 border-dashed border-border dark:border-border-dark rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="trades-csv-input"
                                            />
                                            <label htmlFor="trades-csv-input" className="cursor-pointer">
                                                <Upload className="mx-auto text-text-muted mb-2" size={32} />
                                                {file ? (
                                                    <p className="text-sm text-primary font-medium">{file.name}</p>
                                                ) : (
                                                    <p className="text-sm text-text-muted">
                                                        Click to select or drag and drop a CSV file
                                                    </p>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Result */}
                                    {result && (
                                        <div className={`p-4 rounded-lg ${result.error ? 'bg-accent-error/10 border border-accent-error/20' : 'bg-accent-success/10 border border-accent-success/20'}`}>
                                            <div className="flex items-start gap-3">
                                                {result.error ? (
                                                    <AlertCircle className="text-accent-error mt-0.5" size={20} />
                                                ) : (
                                                    <CheckCircle className="text-accent-success mt-0.5" size={20} />
                                                )}
                                                <div className="flex-1">
                                                    {result.error ? (
                                                        <p className="text-sm text-accent-error">{result.error}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-medium text-accent-success">
                                                                Successfully imported {result.imported} trade{result.imported !== 1 ? 's' : ''}
                                                            </p>
                                                            {result.total_errors > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-accent-warning font-medium">
                                                                        {result.total_errors} error{result.total_errors !== 1 ? 's' : ''} occurred:
                                                                    </p>
                                                                    <ul className="mt-1 text-xs text-text-muted space-y-1 max-h-20 overflow-auto">
                                                                        {result.errors.map((err, idx) => (
                                                                            <li key={idx}>• {err}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg hover:bg-surface-hover focus:outline-none"
                                        >
                                            {result?.imported > 0 ? 'Done' : 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={importMutation.isPending || !file || !selectedAccountId}
                                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {importMutation.isPending ? (
                                                <>Importing...</>
                                            ) : (
                                                <>
                                                    <Upload size={16} />
                                                    Import Trades
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
