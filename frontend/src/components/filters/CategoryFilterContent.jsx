import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';

export default function CategoryFilterContent({ buckets = [], selectedId, onChange, close }) {
    const [search, setSearch] = useState("");

    // Flatten buckets for searching
    const flatBuckets = useMemo(() => {
        const flat = [];
        const process = (items) => {
            for (const item of items) {
                flat.push(item);
                if (item.children) process(item.children);
            }
        };
        process(buckets);
        return flat;
    }, [buckets]);

    // Group buckets for display (Income vs Expenses)
    // We'll stick to the tree structure or just flat list if searching
    const filteredBuckets = useMemo(() => {
        if (!search) return buckets;
        return flatBuckets.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    }, [buckets, flatBuckets, search]);

    const handleSelect = (id) => {
        onChange(id);
        close();
    };

    const renderItem = (item, depth = 0) => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return null;

        const isSelected = selectedId === item.id;

        return (
            <div key={item.id}>
                <button
                    onClick={() => handleSelect(item.id)}
                    className={`
                        w-full text-left px-3 py-2 text-sm flex items-center justify-between group transition-colors
                        ${isSelected
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }
                    `}
                    style={{ paddingLeft: search ? '12px' : `${12 + depth * 12}px` }}
                >
                    <span>{item.name}</span>
                    {isSelected && <Check size={14} />}
                </button>
                {!search && item.children && item.children.map(child => renderItem(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="flex flex-col max-h-[400px]">
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                        autoFocus
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 py-1">
                <button
                    onClick={() => handleSelect(null)}
                    className={`
                        w-full text-left px-3 py-2 text-sm flex items-center justify-between
                        ${selectedId === null
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }
                    `}
                >
                    <span>All Categories</span>
                    {selectedId === null && <Check size={14} />}
                </button>

                {search ? (
                    // Flat list when searching
                    filteredBuckets.map(b => (
                        <button
                            key={b.id}
                            onClick={() => handleSelect(b.id)}
                            className={`
                                w-full text-left px-3 py-2 text-sm flex items-center justify-between group transition-colors
                                ${selectedId === b.id
                                    ? 'bg-primary/5 text-primary font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }
                            `}
                        >
                            <span>{b.name}</span>
                            {selectedId === b.id && <Check size={14} />}
                        </button>
                    ))
                ) : (
                    // Tree structure
                    buckets.map(root => (
                        <div key={root.id}>
                            {/* Group Header for Top Level */}
                            {root.children && root.children.length > 0 && (
                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 mt-1">
                                    {root.name}
                                </div>
                            )}
                            {/* If root itself is selectable and not just a group header (Income usually is group) */}
                            {root.group !== 'Income' && renderItem(root)}

                            {/* Render children - specifically for Income which acts as a group but items are children */}
                            {(root.group === 'Income' || (root.children && root.children.length > 0)) &&
                                root.children.map(child => renderItem(child, root.group === 'Income' ? 0 : 1))
                            }
                        </div>
                    ))
                )}

                {search && filteredBuckets.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm">
                        No categories found
                    </div>
                )}
            </div>
        </div>
    );
}
