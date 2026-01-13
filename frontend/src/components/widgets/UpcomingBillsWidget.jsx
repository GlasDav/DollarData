import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

/**
 * UpcomingBillsWidget - Sidebar version
 * Minimalist design for right sidebar column.
 */
export default function UpcomingBillsWidget({ bills: billsProp = [], formatCurrency }) {
    const bills = Array.isArray(billsProp) ? billsProp : [];

    return (
        <div className="bg-card dark:bg-card-dark p-6 rounded-card shadow-sm border border-border dark:border-border-dark">
            <h2 className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Next 7 Days
            </h2>

            {bills.length === 0 ? (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface dark:bg-surface-dark mb-3">
                        <CheckCircle2 size={24} className="text-text-muted/50" />
                    </div>
                    <p className="text-text-muted dark:text-text-muted-dark text-sm">All caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center text-xs font-bold text-text-muted dark:text-text-muted-dark">
                                    {new Date(bill.due_date).getDate()}
                                </div>
                                <div>
                                    <p className="font-medium text-text-primary dark:text-text-primary-dark text-sm group-hover:text-primary transition-colors">{bill.name}</p>
                                    <p className="text-xs text-text-muted dark:text-text-muted-dark">
                                        {bill.days_until === 0 ? 'Due today' :
                                            bill.days_until === 1 ? 'Tomorrow' :
                                                `In ${bill.days_until} days`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-text-primary dark:text-text-primary-dark text-sm">{formatCurrency(Math.abs(bill.amount))}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
