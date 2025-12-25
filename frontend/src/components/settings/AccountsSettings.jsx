import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Plus, Trash2, Home, TrendingUp, Wallet, ShoppingCart, Link } from 'lucide-react';
import * as api from '../../services/api';

const AccountCard = ({ account, updateAccountMutation, deleteAccountMutation }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${account.type === 'Asset' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {(() => {
                        const c = (account.category || '').toLowerCase();
                        if (c.includes('real estate') || c.includes('property')) return <Home size={20} />;
                        if (c.includes('investment')) return <TrendingUp size={20} />;
                        if (c.includes('loan')) return <Landmark size={20} />;
                        if (account.type === 'Asset') return <Wallet size={20} />;
                        return <ShoppingCart size={20} />;
                    })()}
                </div>

                <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-center gap-2">
                        <input
                            className="font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none transition px-1 flex-1"
                            value={account.name}
                            onChange={(e) => updateAccountMutation.mutate({ id: account.id, data: { ...account, name: e.target.value } })}
                        />
                        {account.connection_id && (
                            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title="Connected via Basiq">
                                <Link size={10} />
                                Linked
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="text-xs text-slate-500 dark:text-slate-400 bg-transparent outline-none cursor-pointer hover:text-indigo-500"
                            value={account.type}
                            onChange={(e) => updateAccountMutation.mutate({ id: account.id, data: { ...account, type: e.target.value } })}
                        >
                            <option value="Asset">Asset</option>
                            <option value="Liability">Liability</option>
                        </select>
                        <span className="text-xs text-slate-300">|</span>
                        <select
                            className="text-xs text-slate-500 dark:text-slate-400 bg-transparent outline-none cursor-pointer hover:text-indigo-500"
                            value={account.category}
                            onChange={(e) => updateAccountMutation.mutate({ id: account.id, data: { ...account, category: e.target.value } })}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Investment">Investment</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Loan">Loan</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (confirm("Delete this account?")) deleteAccountMutation.mutate(account.id);
                    }}
                    className="text-slate-300 hover:text-red-400 transition self-start"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default function AccountsSettings() {
    const queryClient = useQueryClient();
    const { data: accounts = [], isLoading } = useQuery({ queryKey: ['accounts'], queryFn: api.getAccounts });

    const createAccountMutation = useMutation({
        mutationFn: api.createAccount,
        onSuccess: () => queryClient.invalidateQueries(['accounts']),
    });

    const updateAccountMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateAccount(id, data),
        onSuccess: () => queryClient.invalidateQueries(['accounts']),
    });

    const deleteAccountMutation = useMutation({
        mutationFn: api.deleteAccount,
        onSuccess: () => queryClient.invalidateQueries(['accounts']),
    });

    if (isLoading) return <div className="p-4">Loading accounts...</div>;

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Accounts</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage assets and liabilities</p>
                    </div>
                </div>
                <button
                    onClick={() => createAccountMutation.mutate({ name: "New Account", type: "Asset", category: "Cash" })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                >
                    <Plus size={16} />
                    Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(acc => (
                    <AccountCard
                        key={acc.id}
                        account={acc}
                        updateAccountMutation={updateAccountMutation}
                        deleteAccountMutation={deleteAccountMutation}
                    />
                ))}
                {accounts.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        No accounts added yet.
                    </div>
                )}
            </div>
        </section>
    );
}
