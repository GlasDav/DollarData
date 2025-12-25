import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableWidgetWrapper({ id, children, dragHandle = true }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
        touchAction: 'none', // Critical for pointer events
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group transition-all duration-200 ${isDragging ? 'opacity-80 scale-[1.01] shadow-xl rounded-xl ring-2 ring-indigo-500/50 z-50' : ''}`}
        >
            {/* Drag Handle - Top Right or Top Center */}
            {dragHandle && (
                <div
                    {...attributes}
                    {...listeners}
                    className={`
                        absolute -top-3 left-1/2 -translate-x-1/2 z-20 
                        p-1.5 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg
                        text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 
                        cursor-grab active:cursor-grabbing 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        ${isDragging ? 'opacity-0' : ''} 
                    `}
                    title="Drag to reorder section"
                >
                    <GripVertical size={14} />
                </div>
            )}
            {children}
        </div>
    );
}
