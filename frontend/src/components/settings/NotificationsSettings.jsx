import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@headlessui/react';
import { Bell } from 'lucide-react';
import * as api from '../../services/api';

export default function NotificationsSettings() {
    const queryClient = useQueryClient();
    const { data: notificationSettings, isLoading } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: api.getNotificationSettings
    });

    const updateNotificationSettingsMutation = useMutation({
        mutationFn: api.updateNotificationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries(['notificationSettings']);
        },
    });

    if (isLoading) return <div className="p-4">Loading notification settings...</div>;

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Bell size={20} />
                </div>
                <div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configure which alerts you receive</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Budget Alerts */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Budget Exceeded Alerts</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Notify when spending exceeds 80%, 100%, 120% of budget</p>
                    </div>
                    <Switch
                        checked={notificationSettings?.budget_alerts ?? true}
                        onChange={(checked) => updateNotificationSettingsMutation.mutate({
                            ...notificationSettings,
                            budget_alerts: checked
                        })}
                        className={`${notificationSettings?.budget_alerts ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                        <span className={`${notificationSettings?.budget_alerts ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                </div>

                {/* Bill Reminders */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Bill Reminders</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Remind me about upcoming bills</p>
                    </div>
                    <Switch
                        checked={notificationSettings?.bill_reminders ?? true}
                        onChange={(checked) => updateNotificationSettingsMutation.mutate({
                            ...notificationSettings,
                            bill_reminders: checked
                        })}
                        className={`${notificationSettings?.bill_reminders ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                        <span className={`${notificationSettings?.bill_reminders ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                </div>

                {/* Days before bill reminder */}
                {notificationSettings?.bill_reminders && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg ml-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Remind me this many days before</span>
                        <select
                            value={notificationSettings?.bill_reminder_days ?? 3}
                            onChange={(e) => updateNotificationSettingsMutation.mutate({
                                ...notificationSettings,
                                bill_reminder_days: parseInt(e.target.value)
                            })}
                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none cursor-pointer"
                        >
                            {[1, 2, 3, 5, 7].map(d => (
                                <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Goal Milestones */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Goal Milestone Celebrations</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Celebrate when you reach 25%, 50%, 75%, 100% of goals</p>
                    </div>
                    <Switch
                        checked={notificationSettings?.goal_milestones ?? true}
                        onChange={(checked) => updateNotificationSettingsMutation.mutate({
                            ...notificationSettings,
                            goal_milestones: checked
                        })}
                        className={`${notificationSettings?.goal_milestones ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                        <span className={`${notificationSettings?.goal_milestones ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                    </Switch>
                </div>
            </div>
        </section>
    );
}
