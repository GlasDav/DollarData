import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api';
import RulesSection from '../RulesSection';

export default function RulesSettings() {
    // Queries
    const { data: buckets = [], isLoading: bucketsLoading } = useQuery({ queryKey: ['buckets'], queryFn: api.getBucketsTree });

    // Flatten logic
    const flatBuckets = useMemo(() => {
        const flatten = (nodes) => {
            let res = [];
            if (!nodes) return res;
            nodes.forEach(node => {
                res.push(node);
                if (node.children && node.children.length > 0) {
                    res = res.concat(flatten(node.children));
                }
            });
            return res;
        };
        return flatten(buckets);
    }, [buckets]);

    if (bucketsLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-slate-800 dark:text-white">Smart Rules</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Automatically categorize transactions based on keywords. Rules are applied when you click "Run Rules Now" or during import.
                </p>
            </div>

            <RulesSection buckets={flatBuckets} />
        </div>
    );
}
