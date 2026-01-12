import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Trophy, Star, TrendingUp, Award, Crown, Check, Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIER_COLORS = {
    1: { bg: 'bg-amber-900/10 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-700/30' },      // Wood
    2: { bg: 'bg-slate-400/10 dark:bg-slate-400/20', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30' },       // Stone
    3: { bg: 'bg-amber-600/10 dark:bg-amber-600/20', text: 'text-amber-700 dark:text-amber-500', border: 'border-amber-600/30' },       // Bronze
    4: { bg: 'bg-slate-300/20 dark:bg-slate-300/10', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-400/30' },       // Silver
    5: { bg: 'bg-yellow-400/10 dark:bg-yellow-400/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/30' },   // Gold
    6: { bg: 'bg-cyan-300/10 dark:bg-cyan-300/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-400/30' },         // Platinum
    7: { bg: 'bg-blue-300/10 dark:bg-blue-300/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-400/30' },         // Diamond
    8: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-500', border: 'border-orange-500/30' },   // Champion
};

export default function AchievementsWidget() {
    const navigate = useNavigate();

    const { data: summary, isLoading } = useQuery({
        queryKey: ['achievements_summary'],
        queryFn: async () => (await api.get('/achievements/summary')).data
    });

    if (isLoading) {
        return (
            <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark min-h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!summary) return null;

    const { total_earned, total_possible, latest_unlocks = [] } = summary;
    const progress = Math.round((total_earned / total_possible) * 100) || 0;

    return (
        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary dark:text-primary-hover">
                        <Trophy size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">Achievements</h2>
                </div>
                <button
                    onClick={() => navigate('/goals?tab=achievements')}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
                >
                    View All <ChevronRight size={14} />
                </button>
            </div>

            {/* Progress Section */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">{total_earned}</span>
                        <span className="text-sm text-text-muted dark:text-text-muted-dark ml-1">/ {total_possible} Unlocked</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-surface dark:bg-surface-dark rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Latest Unlocks */}
            <div className="flex-1">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Latest Unlocks</h3>
                <div className="space-y-3">
                    {latest_unlocks.length > 0 ? (
                        latest_unlocks.map((achievement, idx) => {
                            const colors = TIER_COLORS[achievement.tier] || TIER_COLORS[1];
                            return (
                                <div
                                    key={`${achievement.achievement_id}-${idx}`}
                                    className={`flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}
                                >
                                    <div className="text-xl">
                                        {achievement.tier_icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`text-sm font-semibold truncate ${colors.text}`}>
                                                {achievement.name}
                                            </h4>
                                            <span className="text-[10px] text-text-muted opacity-70">
                                                {new Date(achievement.unlocked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted dark:text-text-muted-dark truncate">
                                            {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)} • Tier {achievement.tier}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-6 text-text-muted text-sm italic bg-surface dark:bg-surface-dark rounded-xl border border-dashed border-border dark:border-border-dark">
                            No achievements unlocked yet.<br />Start simpler!
                        </div>
                    )}
                </div>
            </div>

            {/* Call to Action */}
            {latest_unlocks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border dark:border-border-dark text-center">
                    <p className="text-xs text-text-muted">
                        {total_possible - total_earned} more badges waiting for you!
                    </p>
                </div>
            )}
        </div>
    );
}
