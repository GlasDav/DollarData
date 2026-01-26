import { Popover, Transition } from '@headlessui/react';
import { ChevronDown, X } from 'lucide-react';
import { Fragment } from 'react';

export default function FilterPill({
    label,
    value,
    isActive,
    onClear,
    children,
    className
}) {
    return (
        <Popover className="relative">
            {({ open }) => (
                <>
                    <Popover.Button
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition border outline-none
                            ${isActive
                                ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-slate-900 dark:hover:text-white'
                            }
                            ${open ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}
                            ${className || ''}
                        `}
                    >
                        <span>{label}</span>

                        {value && (
                            <>
                                <span className="w-px h-3 bg-current opacity-20" />
                                <span className="truncate max-w-[150px] font-semibold">{value}</span>
                            </>
                        )}

                        {isActive ? (
                            <div
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onClear) onClear();
                                }}
                                className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-full p-0.5 transition-colors"
                            >
                                <X size={14} />
                            </div>
                        ) : (
                            <ChevronDown
                                size={14}
                                className={`opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                            />
                        )}
                    </Popover.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="absolute left-0 z-30 mt-2 min-w-[260px] max-w-sm origin-top-left rounded-xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none flex flex-col overflow-hidden">
                            {/* Pass the close function to children if they are a function */}
                            {({ close }) => (
                                typeof children === 'function' ? children({ close }) : children
                            )}
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
