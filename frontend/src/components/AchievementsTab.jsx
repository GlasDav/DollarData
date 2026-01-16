import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    Trophy, Target, PiggyBank, DollarSign, TrendingUp, Crown, Tag, Flame, Star,
    ChevronDown, ChevronUp, Lock, Check
} from 'lucide-react';

const CATEGORY_ICONS = {
    budget: Target,
    savings: PiggyBank,
    income: DollarSign,
    investments: TrendingUp,
    net_worth: Crown,
    organization: Tag,
    consistency: Flame,
    goals: Star,
};

const TIER_COLORS = {
    1: { bg: 'bg-amber-900/20', border: 'border-amber-700', text: 'text-amber-600' },      // Wood
    2: { bg: 'bg-slate-400/20', border: 'border-slate-500', text: 'text-slate-500' },       // Stone
    3: { bg: 'bg-amber-600/20', border: 'border-amber-600', text: 'text-amber-600' },       // Bronze
    4: { bg: 'bg-slate-300/30', border: 'border-slate-400', text: 'text-slate-400' },       // Silver
    5: { bg: 'bg-yellow-400/20', border: 'border-yellow-500', text: 'text-yellow-500' },   // Gold
    6: { bg: 'bg-cyan-300/20', border: 'border-cyan-400', text: 'text-cyan-400' },         // Platinum
    7: { bg: 'bg-blue-300/20', border: 'border-blue-400', text: 'text-blue-400' },         // Diamond
    8: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-500' },   // Champion
};

const CATEGORY_COLORS = {
    budget: 'indigo',
    savings: 'emerald',
    income: 'green',
    investments: 'violet',
    net_worth: 'amber',
    organization: 'blue',
    consistency: 'orange',
    goals: 'yellow',
};

export default function AchievementsTab() {
    const [expandedCategory, setExpandedCategory] = useState(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['achievements'],
        queryFn: async () => {
            const res = await api.get('/achievements');
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-12 text-red-500">
                Failed to load achievements. Please try again.
            </div>
        );
    }

    const { categories = [], summary = {} } = data || {};

    return (
        <div className="space-y-6">
            {/* Summary Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Trophy size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Achievements</h2>
                        <p className="text-white/70">
                            {summary.total_earned || 0} / {summary.total_possible || 64} unlocked
                        </p>
                    </div>
                    <div className="ml-auto text-right">
                        <div className="text-4xl font-bold">{summary.completion_rate || 0}%</div>
                        <div className="text-white/70 text-sm">Complete</div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-700"
                        style={{ width: `${summary.completion_rate || 0}%` }}
                    />
                </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => {
                    const Icon = CATEGORY_ICONS[category.id] || Trophy;
                    const colorName = CATEGORY_COLORS[category.id] || 'indigo';
                    const isExpanded = expandedCategory === category.id;
                    const tierColors = TIER_COLORS[category.current_tier] || TIER_COLORS[1];

                    return (
                        <div
                            key={category.id}
                            className="bg-card dark:bg-card-dark rounded-xl border border-border dark:border-border-dark overflow-hidden"
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                                className="w-full p-4 flex items-center gap-4 hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                            >
                                <div className={`p-2.5 rounded-xl bg-${colorName}-100 dark:bg-${colorName}-900/30`}>
                                    <Icon size={24} className={`text-${colorName}-600 dark:text-${colorName}-400`} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">{category.name}</h3>
                                    <p className="text-sm text-text-muted dark:text-text-muted-dark">
                                        {category.current_tier > 0
                                            ? `${category.tiers[category.current_tier - 1]?.tier_name || 'Wood'} tier`
                                            : 'Not started'
                                        }
                                    </p>
                                </div>

                                {/* Tier Badge */}
                                {category.current_tier > 0 && (
                                    <div className={`min-w-32 px-3 py-1.5 rounded-full text-sm font-medium flex items-center justify-center gap-1 ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                                        <span>{category.tiers[category.current_tier - 1]?.tier_icon}</span>
                                        <span>{category.tiers[category.current_tier - 1]?.tier_name}</span>
                                    </div>
                                )}

                                {/* Progress to next */}
                                <div className="w-20">
                                    <div className="h-2 bg-surface dark:bg-surface-dark rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${colorName}-500 rounded-full transition-all`}
                                            style={{ width: `${category.progress_to_next || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 text-center">
                                        {Math.round(category.progress_to_next || 0)}%
                                    </p>
                                </div>

                                {isExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                            </button>

                            {/* Expanded Tier List */}
                            {isExpanded && (
                                <div className="border-t border-border dark:border-border-dark p-4 space-y-2">
                                    {category.tiers.map(tier => {
                                        const tierColor = TIER_COLORS[tier.tier];
                                        return (
                                            <div
                                                key={tier.tier}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${tier.is_earned
                                                    ? `${tierColor.bg} border ${tierColor.border}`
                                                    : 'bg-surface dark:bg-surface-dark opacity-60'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${tier.is_earned ? tierColor.text : 'text-text-muted'
                                                    }`}>
                                                    {tier.is_earned ? tier.tier_icon : <Lock size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${tier.is_earned ? tierColor.text : 'text-text-muted dark:text-text-muted-dark'}`}>
                                                            {tier.name}
                                                        </span>
                                                        <span className="text-xs text-text-muted dark:text-text-muted-dark">
                                                            ({tier.tier_name})
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-muted dark:text-text-muted-dark">{tier.description}</p>
                                                </div>
                                                {tier.is_earned && (
                                                    <Check size={20} className="text-emerald-500" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
