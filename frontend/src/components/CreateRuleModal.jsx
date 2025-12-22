import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, BookPlus, Loader2 } from 'lucide-react';
import { createRule } from '../services/api';

/**
 * Modal to create a Smart Rule from a transaction.
 * Pre-populates keyword from transaction description.
 */
export default function CreateRuleModal({ isOpen, onClose, transaction, buckets }) {
    const queryClient = useQueryClient();
    const [keyword, setKeyword] = useState(transaction?.description || '');
    const [bucketId, setBucketId] = useState(transaction?.bucket_id || '');
    const [priority, setPriority] = useState(0);
    const [error, setError] = useState('');

    // Reset form when transaction changes
    React.useEffect(() => {
        if (transaction) {
            setKeyword(transaction.description || '');
            setBucketId(transaction.bucket_id || '');
            setPriority(0);
            setError('');
        }
    }, [transaction]);

    const createRuleMutation = useMutation({
        mutationFn: createRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            onClose();
        },
        onError: (err) => {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to create rule');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!keyword.trim() || !bucketId) {
            setError('Please enter a keyword and select a category');
            return;
        }
        createRuleMutation.mutate({
            keywords: keyword.trim().toLowerCase(),
            bucket_id: parseInt(bucketId),
            priority: parseInt(priority) || 0
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <BookPlus className="text-indigo-500" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Smart Rule</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Keyword to match
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g. woolworths, netflix, uber"
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Future transactions containing this keyword will auto-categorize
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Assign to category
                        </label>
                        <select
                            value={bucketId}
                            onChange={(e) => setBucketId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Select a category...</option>
                            {buckets?.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Priority (optional)
                        </label>
                        <input
                            type="number"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            placeholder="0"
                            className="w-24 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Higher priority rules are applied first
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createRuleMutation.isPending}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {createRuleMutation.isPending ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <BookPlus size={16} />
                                    Create Rule
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
