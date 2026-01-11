import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

/**
 * Modal for importing net worth history from a CSV file.
 * Uses design tokens and matches other modal styles in the app.
 */
export default function ImportNetWorthModal({ isOpen, onClose }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);
    const queryClient = useQueryClient();

    const importMutation = useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/net-worth/import-history', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['netWorthHistory'] });
        },
        onError: (error) => {
            setResult({
                imported_snapshots: 0,
                created_accounts: 0,
                updated_accounts: 0,
                errors: [error.response?.data?.detail || 'Import failed. Please check your file format.']
            });
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setResult(null);
        }
    };

    const handleImport = () => {
        if (selectedFile) {
            importMutation.mutate(selectedFile);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setResult(null);
        importMutation.reset();
        onClose();
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
                    <div className="fixed inset-0 bg-black/25" />
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
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-text-primary dark:text-text-primary-dark flex justify-between items-center mb-6"
                                >
                                    Import Net Worth History
                                    <button onClick={handleClose} className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
                                        <X size={20} />
                                    </button>
                                </Dialog.Title>

                                <div className="space-y-4">
                                    {/* Instructions */}
                                    <div className="text-sm text-text-muted dark:text-text-muted-dark space-y-2">
                                        <p>Upload a CSV file with your net worth history. Required columns:</p>
                                        <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                                            <li><code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded text-text-primary dark:text-text-primary-dark">date</code> - Format: DD/MM/YYYY</li>
                                            <li><code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded text-text-primary dark:text-text-primary-dark">account_name</code> - e.g., "Savings Account"</li>
                                            <li><code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded text-text-primary dark:text-text-primary-dark">account_type</code> - "Asset" or "Liability"</li>
                                            <li><code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded text-text-primary dark:text-text-primary-dark">account_category</code> - e.g., "Cash", "Investment"</li>
                                            <li><code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded text-text-primary dark:text-text-primary-dark">balance</code> - Positive number</li>
                                        </ul>
                                    </div>

                                    {/* File Input */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-border dark:border-border-dark rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-2 text-text-primary dark:text-text-primary-dark">
                                                <FileText className="w-5 h-5 text-primary" />
                                                <span className="font-medium">{selectedFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="w-8 h-8 mx-auto text-text-muted dark:text-text-muted-dark" />
                                                <p className="text-text-muted dark:text-text-muted-dark">
                                                    Click to select a CSV file
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Results */}
                                    {result && (
                                        <div className={`rounded-xl p-4 ${result.errors?.length > 0 && result.imported_snapshots === 0 ? 'bg-accent-error/10' : 'bg-accent-success/10'}`}>
                                            {(result.imported_snapshots > 0 || result.created_accounts > 0) && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-accent-success font-medium">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Import Complete
                                                    </div>
                                                    <ul className="text-sm text-text-muted dark:text-text-muted-dark space-y-1">
                                                        {result.imported_snapshots > 0 && (
                                                            <li>✓ {result.imported_snapshots} snapshot{result.imported_snapshots !== 1 ? 's' : ''} imported</li>
                                                        )}
                                                        {result.created_accounts > 0 && (
                                                            <li>✓ {result.created_accounts} new account{result.created_accounts !== 1 ? 's' : ''} created</li>
                                                        )}
                                                        {result.updated_accounts > 0 && (
                                                            <li>✓ {result.updated_accounts} account{result.updated_accounts !== 1 ? 's' : ''} updated</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {result.errors?.length > 0 && (
                                                <div className={`space-y-2 ${result.imported_snapshots > 0 ? 'mt-3 pt-3 border-t border-border dark:border-border-dark' : ''}`}>
                                                    <div className="flex items-center gap-2 text-accent-error font-medium">
                                                        <AlertCircle className="w-5 h-5" />
                                                        {result.imported_snapshots > 0 ? 'Some rows had errors:' : 'Import Failed'}
                                                    </div>
                                                    <ul className="text-sm text-text-muted dark:text-text-muted-dark space-y-1 max-h-32 overflow-y-auto">
                                                        {result.errors.map((err, i) => (
                                                            <li key={i}>• {err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-surface dark:bg-surface-dark px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-dark-hover focus:outline-none transition-colors"
                                        onClick={handleClose}
                                    >
                                        {result ? 'Close' : 'Cancel'}
                                    </button>
                                    {!result && (
                                        <button
                                            onClick={handleImport}
                                            disabled={!selectedFile || importMutation.isPending}
                                            className="inline-flex justify-center rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {importMutation.isPending ? 'Importing...' : 'Import'}
                                        </button>
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
