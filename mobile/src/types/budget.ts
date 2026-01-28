export interface BudgetLimit {
    amount: number;
    period: 'monthly' | 'yearly';
}

export interface BudgetBucket {
    id: string;
    name: string;
    type: 'Needs' | 'Wants' | 'Savings' | 'Income' | 'Transfer';
    limit: number;
    spent: number;
    color?: string;
    icon?: string;
}

export const MOCK_BUDGETS: BudgetBucket[] = [
    {
        id: '1',
        name: 'Groceries',
        type: 'Needs',
        limit: 600,
        spent: 450.25,
        color: '#10b981', // emerald-500
        icon: 'cart',
    },
    {
        id: '2',
        name: 'Rent / Mortgage',
        type: 'Needs',
        limit: 2200,
        spent: 2200,
        color: '#3b82f6', // blue-500
        icon: 'home',
    },
    {
        id: '3',
        name: 'Dining Out',
        type: 'Wants',
        limit: 300,
        spent: 325.50, // Over budget
        color: '#f59e0b', // amber-500
        icon: 'food',
    },
    {
        id: '4',
        name: 'Entertainment',
        type: 'Wants',
        limit: 150,
        spent: 45.00,
        color: '#8b5cf6', // violet-500
        icon: 'movie',
    },
    {
        id: '5',
        name: 'Utilities',
        type: 'Needs',
        limit: 250,
        spent: 180.00,
        color: '#06b6d4', // cyan-500
        icon: 'flash',
    },
];
