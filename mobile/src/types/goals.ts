export interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date?: string; // YYYY-MM-DD
    color?: string;
    icon?: string;
}

export const MOCK_GOALS: Goal[] = [
    {
        id: '1',
        name: 'Emergency Fund',
        target_amount: 10000,
        current_amount: 5500,
        color: '#10b981', // emerald-500
        icon: 'shield',
    },
    {
        id: '2',
        name: 'New Car',
        target_amount: 35000,
        current_amount: 8200,
        target_date: '2027-12-31',
        color: '#3b82f6', // blue-500
        icon: 'car',
    },
    {
        id: '3',
        name: 'Japan Trip',
        target_amount: 8000,
        current_amount: 1500,
        target_date: '2026-11-01',
        color: '#f59e0b', // amber-500
        icon: 'airplane',
    },
    {
        id: '4',
        name: 'Home Deposit',
        target_amount: 150000,
        current_amount: 45000,
        target_date: '2028-06-30',
        color: '#8b5cf6', // violet-500
        icon: 'home',
    }
];
