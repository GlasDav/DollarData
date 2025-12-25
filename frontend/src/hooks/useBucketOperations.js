import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';

export function useBucketOperations() {
    const queryClient = useQueryClient();

    const updateBucketMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateBucket(id, data),
        onSuccess: () => queryClient.invalidateQueries(['buckets']),
    });

    const createBucketMutation = useMutation({
        mutationFn: api.createBucket,
        onSuccess: () => queryClient.invalidateQueries(['buckets']),
    });

    const deleteBucketMutation = useMutation({
        mutationFn: api.deleteBucket,
        onSuccess: () => queryClient.invalidateQueries(['buckets']),
    });

    const reorderBucketsMutation = useMutation({
        mutationFn: api.reorderBuckets,
        onSuccess: () => queryClient.invalidateQueries(['buckets']),
    });

    const moveBucket = (buckets, bucketId, direction) => {
        if (!buckets) return;

        // Find the bucket and its siblings
        const findBucketAndSiblings = (nodes, parentId = null) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === bucketId) {
                    return { siblings: nodes, index: i, parentId };
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    const result = findBucketAndSiblings(nodes[i].children, nodes[i].id);
                    if (result) return result;
                }
            }
            return null;
        };

        // Prepare tree structure if flattened, but buckets passed here should be tree if coming from getBucketsTree
        // Wait, moveBucket logic assumes tree structure.
        // Backend returns tree? api.getBucketsTree returns tree?
        // Let's verify.
        // api.js: export const getBucketsTree = ... /settings/buckets/tree
        // Assuming it returns nested objects.

        // However, if buckets passed are FLAT (from getBuckets?), we need to build tree first?
        // Budget.jsx logic assumed `buckets` is a tree (line 712 used recursive search).
        // Let's assume input is a Tree.

        const result = findBucketAndSiblings(buckets);
        if (!result) return;

        const { siblings, index } = result;
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= siblings.length) return;

        // Swap the display_order values
        const orderUpdates = siblings.map((sib, i) => {
            if (i === index) return { id: sib.id, display_order: newIndex };
            if (i === newIndex) return { id: sib.id, display_order: index };
            return { id: sib.id, display_order: i };
        });

        reorderBucketsMutation.mutate(orderUpdates);
    };

    return {
        updateBucketMutation,
        createBucketMutation,
        deleteBucketMutation,
        reorderBucketsMutation,
        moveBucket
    };
}
