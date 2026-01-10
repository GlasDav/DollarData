import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, UploadCloud, Check, AlertCircle, FileText } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function ImportInvestmentsModal({ isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // --- Queries ---
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['investment-accounts'],
        queryFn: async () => {
            const res = await api.get('/net-worth/accounts');
            return (res.data || []).filter(acc => acc.category === 'Investment');
        },
        enabled: isOpen
    });

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // --- Mutations ---
    const importMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('file', file);

            // Note: using direct axios post to ensure multipart/form-data if api wrapper doesn't handle it auto (it should)
            const res = await api.post(`/investments/${selectedAccountId}/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data;
        },
        onSuccess: (data) => {
            setImportResult(data);
            queryClient.invalidateQueries(['investments-portfolio']);
            queryClient.invalidateQueries(['investments-holdings']);
            queryClient.invalidateQueries(['investments-allocation']);
            // Don't close immediately, show result
        },
        onError: (err) => {
            console.error("Import failed:", err);
            setImportResult({ ok: false, errors: [err.response?.data?.detail || err.message] });
        }
    });

    // --- Handlers ---
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (f) => {
        if (f.type === 'text/csv' || f.name.endsWith('.csv')) {
            setFile(f);
            setImportResult(null);
        } else {
            alert("Please upload a CSV file.");
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setFile(null);
            setImportResult(null);
        }, 300);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                                        Import Holdings
                                    </Dialog.Title>
                                    <button
                                        onClick={handleClose}
                                        className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark focus:outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {importResult && importResult.ok ? (
                                    <div className="text-center py-6 space-y-4">
                                        <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto text-accent-success">
                                            <Check size={32} />
                                        </div>
                                        <h4 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">Import Successful!</h4>
                                        <p className="text-text-secondary text-sm">
                                            Found <b>{importResult.imported}</b> new holdings<br />
                                            Updated <b>{importResult.updated}</b> existing holdings
                                        </p>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="mt-4 p-3 bg-accent-error/10 dark:bg-accent-error/20 rounded-lg text-left">
                                                <p className="text-xs font-bold text-accent-error dark:text-accent-error mb-1">Errors ({importResult.errors.length}):</p>
                                                <ul className="text-xs text-accent-error/80 dark:text-accent-error/80 max-h-32 overflow-y-auto list-disc pl-4">
                                                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleClose}
                                            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Account Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                                Target Account
                                            </label>
                                            <select
                                                value={selectedAccountId || ''}
                                                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-surface dark:bg-surface-dark border border-input dark:border-border-dark rounded-lg text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary outline-none"
                                            >
                                                <option value="" disabled>Select an account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* File Upload Area */}
                                        <div
                                            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${dragActive
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border dark:border-border-dark hover:border-primary/50 hover:bg-surface dark:hover:bg-surface-dark'
                                                }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('file-upload').click()}
                                        >
                                            <input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                accept=".csv"
                                                onChange={handleChange}
                                            />

                                            {file ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                        <FileText size={24} />
                                                    </div>
                                                    <span className="font-medium text-text-primary dark:text-text-primary-dark">{file.name}</span>
                                                    <span className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                        className="text-xs text-accent-error hover:underline mt-2"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-10 w-10 text-text-muted mb-3" />
                                                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                                                        Click or Drag to Upload CSV
                                                    </p>
                                                    <p className="text-xs text-text-muted mt-1">
                                                        Supported: .csv
                                                    </p>
                                                    <div className="mt-4 text-xs text-text-muted bg-surface dark:bg-surface-dark p-2 rounded text-left w-full max-w-xs">
                                                        Required Headers: <code>Ticker</code>, <code>Quantity</code><br />
                                                        Optional: <code>Cost Basis</code>, <code>Name</code>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Error State */}
                                        {importResult && !importResult.ok && (
                                            <div className="p-3 bg-accent-error/10 dark:bg-accent-error/20 rounded-lg flex items-start gap-2">
                                                <AlertCircle className="shrink-0 text-accent-error mt-0.5" size={16} />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-accent-error">Import Failed</p>
                                                    {importResult.errors.map((e, i) => (
                                                        <p key={i} className="text-xs text-accent-error/80">{e}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={handleClose}
                                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary dark:text-text-secondary-dark mr-3"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => importMutation.mutate()}
                                                disabled={!file || !selectedAccountId || importMutation.isPending}
                                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {importMutation.isPending ? 'Importing...' : 'Import Holdings'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
