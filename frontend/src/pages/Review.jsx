import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getBuckets, getSettings } from '../services/api';
import { CheckCircle, XCircle, Clock, Users, ArrowRight } from 'lucide-react';

export default function Review() {
    const queryClient = useQueryClient();

    // Fetch user settings
    const { data: userSettings, isLoading: loadingSettings } = useQuery({
        queryKey: ['userSettings'],
        queryFn: getSettings
    });

    // Fetch buckets for category display
    const { data: buckets = [] } = useQuery({
        queryKey: ['buckets'],
        queryFn: getBuckets
    });

    // Fetch pending review transactions
    const { data: reviewData, isLoading: loadingReview } = useQuery({
        queryKey: ['pendingReview'],
        queryFn: async () => {
            const res = await api.get('/transactions/pending-review');
            return res.data;
        }
    });

    // Update transaction mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            await api.put(`/transactions/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingReview'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const transactions = reviewData?.items || [];
    const pendingForA = transactions.filter(t => t.assigned_to === 'A');
    const pendingForB = transactions.filter(t => t.assigned_to === 'B');

    const handleApprove = (txnId) => {
        updateMutation.mutate({ id: txnId, data: { assigned_to: '', is_verified: true } });
    };

    const handleAssign = (txnId, assignTo) => {
        updateMutation.mutate({ id: txnId, data: { assigned_to: assignTo } });
    };

    if (loadingSettings || loadingReview) {
        return <div className="p-8 dark:bg-slate-900 dark:text-white h-screen">Loading...</div>;
    }

    if (!userSettings?.is_couple_mode) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                        <Users size={48} className="mx-auto text-slate-400 mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 dark:text-white mb-2">Partner Review</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Partner review is only available in Couple Mode.
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                            Enable Couple Mode in Settings to use this feature.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    const TransactionRow = ({ txn, showAssignedTo }) => {
        const bucket = buckets.find(b => b.id === txn.bucket_id);
        return (
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-white truncate">{txn.description}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(txn.date).toLocaleDateString('en-AU')}
                    </div>
                </div>
                <div className="mx-4">
                    <select
                        className="bg-slate-50 dark:bg-slate-700 border-0 rounded-md text-sm text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-500 py-1.5 pl-2 pr-8"
                        value={txn.bucket_id || ""}
                        onChange={(e) => updateMutation.mutate({
                            id: txn.id,
                            data: { bucket_id: e.target.value ? parseInt(e.target.value) : null }
                        })}
                    >
                        <option value="">Uncategorized</option>
                        {buckets.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
                <div className={`text-right font-semibold mr-4 w-24 ${txn.amount < 0 ? 'text-slate-800 dark:text-white' : 'text-green-600'}`}>
                    ${Math.abs(txn.amount).toFixed(2)}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleApprove(txn.id)}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg text-sm font-medium transition"
                    >
                        <CheckCircle size={16} />
                        Approve
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Partner Review</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Review and approve transactions assigned by your partner.
                    </p>
                </header>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{pendingForA.length}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Pending for {userSettings?.name_a || 'Partner A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-800 dark:text-white">{pendingForB.length}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Pending for {userSettings?.name_b || 'Partner B'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partner A's Queue */}
                {pendingForA.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 dark:text-white mb-3">
                            For {userSettings?.name_a || 'Partner A'} to Review
                        </h2>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {pendingForA.map(txn => (
                                <TransactionRow key={txn.id} txn={txn} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Partner B's Queue */}
                {pendingForB.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 dark:text-white mb-3">
                            For {userSettings?.name_b || 'Partner B'} to Review
                        </h2>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {pendingForB.map(txn => (
                                <TransactionRow key={txn.id} txn={txn} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {transactions.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-2">All caught up!</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            No transactions need review right now.
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                            To assign a transaction for review, select "Assign to Partner" in the Transactions page.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
