import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const SortHeader = ({ column, children, className = "", sortBy, sortDir, onSort }) => (
    <th
        className={`px-3 py-3 font-semibold text-sm text-text-secondary dark:text-text-secondary-dark cursor-pointer hover:text-primary transition select-none ${className} ${className.includes('text-right') ? 'pr-6' : ''}`}
        onClick={() => onSort(column)}
    >
        <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
            {children}
            {sortBy === column && (
                sortDir === "asc" ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
            )}
        </div>
    </th>
);

export default React.memo(SortHeader);
