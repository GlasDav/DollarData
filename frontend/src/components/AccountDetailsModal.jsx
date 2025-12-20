import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import HoldingsTable from './HoldingsTable';

/**
 * AccountDetailsModal - Shows details for an account.
 * For Investment accounts, displays the HoldingsTable component.
 */
const AccountDetailsModal = ({ isOpen, onClose, account }) => {
    const isInvestment = account?.category === 'Investment';

    if (!isOpen || !account) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                        <div>
                            <Dialog.Title className="text-xl font-bold text-slate-900 dark:text-white">
                                {account.name}
                            </Dialog.Title>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{account.category} Details</p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6">
                        {!isInvestment ? (
                            <div className="text-center text-slate-500 py-12">
                                <p>Detailed holdings are currently available for Investment accounts only.</p>
                            </div>
                        ) : (
                            <HoldingsTable accountId={account.id} />
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default AccountDetailsModal;
