import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Key, Lock, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import * as api from '../../services/api';

export default function SecuritySettings() {
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [mfaEnabled, setMfaEnabled] = useState(false); // Placeholder state

    const changePasswordMutation = useMutation({
        mutationFn: (data) => api.updatePassword({
            current_password: data.current,
            new_password: data.new
        }),
        onSuccess: () => {
            setMessage("Password changed successfully!");
            setPasswordData({ current: '', new: '', confirm: '' });
            setTimeout(() => setMessage(null), 3000);
        },
        onError: (err) => {
            setError(err.response?.data?.detail || "Failed to change password");
            setTimeout(() => setError(null), 3000);
        }
    });

    const logoutAllMutation = useMutation({
        mutationFn: api.logoutAllSessions,
        onSuccess: () => {
            alert("All other sessions have been logged out.");
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            setError("New passwords do not match");
            return;
        }
        if (passwordData.new.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        changePasswordMutation.mutate(passwordData);
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                    <Shield size={20} />
                </div>
                <div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Security</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account security</p>
                </div>
            </div>

            {/* Change Password */}
            <div className="max-w-md">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Key size={16} /> Change Password
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Current Password"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            value={passwordData.current}
                            onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="New Password"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            value={passwordData.new}
                            onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            value={passwordData.confirm}
                            onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            required
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {message && <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> {message}</p>}

                    <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            <hr className="border-slate-100 dark:border-slate-700" />

            {/* MFA Placeholder */}
            <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <Smartphone size={16} /> Multi-Factor Authentication
                </h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Secure your account with an additional verification step.</p>
                    </div>
                    <button
                        className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
                        disabled
                    >
                        Coming Soon
                    </button>
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700" />

            {/* Sessions */}
            <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                    <Lock size={16} /> Session Management
                </h3>
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                    <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Log out of all devices</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">This will terminate all active sessions except this one.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to log out of all other devices?")) logoutAllMutation.mutate();
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition shadow-sm"
                    >
                        Log Out All
                    </button>
                </div>
            </div>
        </section>
    );
}
