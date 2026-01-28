export interface Category {
    id: string;
    name: string;
    color: string;
    icon?: string;
}

export interface Merchant {
    id: string;
    name: string;
    logo_url?: string;
}

export interface Transaction {
    id: string;
    date: string; // ISO 8601 YYYY-MM-DD
    amount: number;
    description: string;
    merchant?: Merchant;
    category: Category;
    account_name: string;
    type: 'income' | 'expense';
    status: 'pending' | 'posted';
}

export const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: '1',
        date: '2026-01-27',
        amount: 24.90,
        description: 'Uber Ride',
        merchant: { id: 'm1', name: 'Uber' },
        category: { id: 'c1', name: 'Transport', color: '#3b82f6', icon: 'car' },
        account_name: 'Amex Platinum',
        type: 'expense',
        status: 'posted',
    },
    {
        id: '2',
        date: '2026-01-27',
        amount: 14.50,
        description: 'Lunch at Cafe',
        merchant: { id: 'm2', name: 'Joe\'s Cafe' },
        category: { id: 'c2', name: 'Dining', color: '#ef4444', icon: 'food' },
        account_name: 'Everyday Checking',
        type: 'expense',
        status: 'posted',
    },
    {
        id: '3',
        date: '2026-01-26',
        amount: 150.00,
        description: 'Weekly Groceries',
        merchant: { id: 'm3', name: 'Woolworths' },
        category: { id: 'c3', name: 'Groceries', color: '#10b981', icon: 'cart' },
        account_name: 'Joint Saver',
        type: 'expense',
        status: 'posted',
    },
    {
        id: '4',
        date: '2026-01-25',
        amount: 4500.00,
        description: 'Monthly Salary',
        merchant: { id: 'm4', name: 'Employer Inc' },
        category: { id: 'c4', name: 'Income', color: '#22c55e', icon: 'cash' },
        account_name: 'Everyday Checking',
        type: 'income',
        status: 'posted',
    },
    {
        id: '5',
        date: '2026-01-24',
        amount: 12.00,
        description: 'Netflix Subscription',
        merchant: { id: 'm5', name: 'Netflix' },
        category: { id: 'c5', name: 'Entertainment', color: '#8b5cf6', icon: 'movie' },
        account_name: 'Amex Platinum',
        type: 'expense',
        status: 'posted',
    },
];
