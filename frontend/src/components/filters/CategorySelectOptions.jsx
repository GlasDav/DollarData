import React, { useMemo } from 'react';

const CategorySelectOptions = React.memo(({ buckets }) => {
    // Helper to flatten/process tree for <option> rendering
    const renderOptions = (items) => {
        if (!items || items.length === 0) return null;

        return items.map(parent => {
            // INCOME GROUP SPECIAL HANDLING
            if (parent.name === 'Income' && parent.group === 'Income') {
                if (parent.children && parent.children.length > 0) {
                    return (
                        <optgroup key={parent.id} label="Income" className="dark:bg-slate-800 dark:text-white text-slate-900">
                            {parent.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                                <option key={child.id} value={child.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{child.name}</option>
                            ))}
                        </optgroup>
                    );
                }
                return null;
            }

            // PARENT WITH CHILDREN -> OPTGROUP
            if (parent.children && parent.children.length > 0) {
                return (
                    <optgroup key={parent.id} label={parent.name} className="dark:bg-slate-800 dark:text-white text-slate-900">
                        {parent.children.sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                            <option key={child.id} value={child.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{child.name}</option>
                        ))}
                    </optgroup>
                );
            }

            // LEAF NODE -> OPTION
            return <option key={parent.id} value={parent.id} className="dark:bg-slate-800 dark:text-white text-slate-900">{parent.name}</option>;
        });
    };

    return (
        <>
            <option value="">Uncategorized</option>
            {renderOptions(buckets)}
        </>
    );
});

export default CategorySelectOptions;
