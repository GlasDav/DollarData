import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings as SettingsIcon,
    List,
    LineChart,
    CreditCard,
    Target,
    BarChart3,
    MessageCircle,
    PiggyBank,
    LogOut,
    X
} from 'lucide-react';

// Enhanced NavItem component with left accent indicator
function NavItem({ to, icon: Icon, children, end = false, onClick }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) => `
        group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
        ${isActive
                    ? 'bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent text-primary dark:text-primary-light font-medium'
                    : 'text-text-muted dark:text-text-muted-dark hover:bg-surface dark:hover:bg-card-dark/50 hover:text-text-primary dark:hover:text-text-primary-dark'
                }
      `}
        >
            {({ isActive }) => (
                <>
                    {/* Left accent indicator */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-200 ${isActive ? 'h-5 bg-gradient-to-b from-primary to-primary-hover' : 'h-0 bg-transparent'}`}></div>
                    <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} />
                    <span className="transition-transform duration-200 group-hover:translate-x-1">{children}</span>
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar({ isOpen, onClose, onLogout, onFeedback }) {
    return (
        <div
            className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card dark:bg-card-dark 
        border-r border-border dark:border-border-dark flex flex-col shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        >
            {/* Logo Header */}
            <div className="h-[72px] px-4 border-b border-border dark:border-border-dark flex items-center justify-between">
                <div className="flex items-center">
                    <img src="/brand-logo.svg" alt="DollarData" className="h-10 w-auto dark:hidden" />
                    <img src="/brand-logo-dark.svg" alt="DollarData" className="h-10 w-auto hidden dark:block" />
                </div>
                {/* Close Button (visible when drawer is open) */}
                <button
                    onClick={onClose}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                {/* Overview */}
                <div className="mb-4">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-text-muted-dark opacity-70">Overview</div>
                    <NavItem to="/dashboard" icon={LayoutDashboard} onClick={onClose}>Dashboard</NavItem>
                </div>

                {/* Money */}
                <div className="mb-4">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Money</div>
                    <NavItem to="/transactions" icon={List} onClick={onClose}>Transactions</NavItem>
                    <NavItem to="/subscriptions" icon={CreditCard} onClick={onClose}>Subscriptions</NavItem>
                    <NavItem to="/budget" icon={PiggyBank} onClick={onClose}>Budget</NavItem>
                    <NavItem to="/net-worth" icon={LineChart} onClick={onClose}>Net Worth</NavItem>
                </div>

                {/* Planning */}
                <div className="mb-4">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Planning</div>
                    <NavItem to="/goals" icon={Target} onClick={onClose}>Goals & Achievements</NavItem>
                    <NavItem to="/reports" icon={BarChart3} onClick={onClose}>Reports</NavItem>
                </div>

                {/* System */}
                <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">System</div>
                    <NavItem to="/settings" icon={SettingsIcon} onClick={onClose}>Settings</NavItem>
                </div>
            </nav>

            <div className="p-3 border-t border-border dark:border-border-dark">
                <button
                    onClick={() => {
                        onFeedback();
                        onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted dark:text-text-muted-dark hover:bg-surface dark:hover:bg-card-dark w-full transition-all duration-200 mb-1"
                >
                    <MessageCircle size={18} />
                    Send Feedback
                </button>
                <button
                    onClick={() => {
                        onLogout();
                        onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all duration-200"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
