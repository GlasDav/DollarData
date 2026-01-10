import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

/**
 * SummaryCardsWidget - Displays the 4 main summary cards: Income, Expenses, Net Savings, Net Worth
 */
export default function SummaryCardsWidget({ totals, netWorth, formatCurrency }) {
    // Default values to prevent crashes when data is loading
    const safeTotal = totals || { income: 0, expenses: 0, net_savings: 0 };
    const safeNetWorth = netWorth ?? 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(safeTotal.income)}</p>
            </div>
            <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Expenses</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">{formatCurrency(safeTotal.expenses)}</p>
            </div>
            <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Net Savings</p>
                <p className={`text-2xl font-bold mt-1 ${safeTotal.net_savings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatCurrency(safeTotal.net_savings)}
                </p>
            </div>
            <Link to="/net-worth" className="bg-gradient-to-br from-primary to-primary-hover p-6 rounded-2xl shadow-sm text-white hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-primary-light/80 flex items-center gap-2">
                        <Wallet size={16} /> Net Worth
                    </p>
                    <p className="text-2xl font-bold mt-1">
                        {formatCurrency(safeNetWorth)}
                    </p>
                </div>

            </Link>
        </div>
    );
}

