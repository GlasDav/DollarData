import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { StickyNote, X, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function TransactionNoteModal({ isOpen, onClose, transaction }) {
    const [note, setNote] = useState("");
    const queryClient = useQueryClient();

    useEffect(() => {
        if (transaction) {
            setNote(transaction.notes || "");
        }
    }, [transaction]);

    const updateNoteMutation = useMutation({
        mutationFn: async () => {
            // We use the general update endpoint
            await api.put(`/transactions/${transaction.id}`, { notes: note });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            onClose();
        }
    });

    const handleSave = () => {
        updateNoteMutation.mutate();
    };

    if (!transaction) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md bg-card dark:bg-card-dark rounded-xl shadow-xl overflow-hidden border border-border dark:border-border-dark">
                    <div className="bg-surface dark:bg-surface-dark px-6 py-4 border-b border-border dark:border-border-dark flex justify-between items-center">
                        <h3 className="font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                            <StickyNote size={20} className="text-primary" />
                            Transaction Note
                        </h3>
                        <button onClick={onClose} className="text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">
                                {transaction.description}
                            </p>
                            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                {new Date(transaction.date).toLocaleDateString()} • ${transaction.amount.toFixed(2)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                                    Note
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add details (e.g. 'Dinner with friends', 'Warranty expires 2025')..."
                                    rows={4}
                                    className="w-full rounded-lg border-input dark:border-border-dark bg-card dark:bg-card-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary focus:ring-primary resize-none placeholder-text-muted/50"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface dark:bg-surface-dark px-6 py-4 flex justify-end gap-3 border-t border-border dark:border-border-dark">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-dark-hover rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateNoteMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {updateNoteMutation.isPending && <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>}
                            Save Note
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
