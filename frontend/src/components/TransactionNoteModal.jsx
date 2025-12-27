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
                <Dialog.Panel className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <StickyNote size={20} className="text-indigo-500" />
                            Transaction Note
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {transaction.description}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {new Date(transaction.date).toLocaleDateString()} • ${transaction.amount.toFixed(2)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Note
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add details (e.g. 'Dinner with friends', 'Warranty expires 2025')..."
                                    rows={4}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateNoteMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
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
