import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import BucketTableSection from '../components/BucketTableSection';
import RulesSection from '../components/RulesSection';
import { useBucketOperations } from '../hooks/useBucketOperations';

export default function Budget() {
    const { theme } = useTheme();

    // Queries
    const { data: userSettings, isLoading: settingsLoading } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });
    const { data: buckets = [], isLoading: bucketsLoading } = useQuery({ queryKey: ['buckets'], queryFn: api.getBucketsTree });
    const { data: allTags = [], isLoading: tagsLoading } = useQuery({ queryKey: ['tags'], queryFn: api.getTags });
    const { data: members = [], isLoading: membersLoading } = useQuery({ queryKey: ['members'], queryFn: api.getMembers });

    const isLoading = settingsLoading || bucketsLoading || tagsLoading || membersLoading;

    // Custom Hook for Mutations
    const {
        updateBucketMutation,
        createBucketMutation,
        deleteBucketMutation,
        moveBucket
    } = useBucketOperations();

    // Flatten buckets tree for Rules dropdown
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

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Budget & Categories</h1>

            <BucketTableSection
                title={null}
                buckets={buckets}
                userSettings={userSettings}
                members={members}
                createBucketMutation={createBucketMutation}
                updateBucketMutation={updateBucketMutation}
                deleteBucketMutation={deleteBucketMutation}
                groupName="Discretionary"
                allTags={allTags.map(t => t.name)}
                onMoveBucket={(id, dir) => moveBucket(buckets, id, dir)}
            />

            {/* Smart Rules Section */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Smart Rules</h2>
                <RulesSection buckets={flatBuckets} />
            </section>
        </div>
    );
}
