import React, { useState } from 'react';
import { Calculator, TrendingDown, Wrench } from 'lucide-react';
import TaxCalculator from './TaxCalculator';
import DebtVisualizer from './DebtVisualizer';

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                ${active
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }
            `}
        >
            <Icon size={18} />
            {children}
        </button>
    );
}

export default function Tools() {
    const [activeTab, setActiveTab] = useState('tax');

    return (
        <div className="min-h-screen">
            {/* Header with Tabs */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Wrench className="text-white" size={20} />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tools</h1>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                            <TabButton
                                active={activeTab === 'tax'}
                                onClick={() => setActiveTab('tax')}
                                icon={Calculator}
                            >
                                Tax Planner
                            </TabButton>
                            <TabButton
                                active={activeTab === 'debt'}
                                onClick={() => setActiveTab('debt')}
                                icon={TrendingDown}
                            >
                                Debt Payoff
                            </TabButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'tax' && <TaxCalculator />}
                {activeTab === 'debt' && <DebtVisualizer />}
            </div>
        </div>
    );
}
