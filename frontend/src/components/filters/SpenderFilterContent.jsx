import React from 'react';
import { Check } from 'lucide-react';

export default function SpenderFilterContent({ members = [], selectedSpender, onChange, close }) {
    const handleSelect = (val) => {
        onChange(val);
        close();
    };

    return (
        <div className="flex flex-col py-1">
            <button
                onClick={() => handleSelect(null)}
                className={`
                    w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors
                    ${selectedSpender === null
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }
                `}
            >
                <span>All Spenders</span>
                {selectedSpender === null && <Check size={14} />}
            </button>

            <button
                onClick={() => handleSelect('Joint')}
                className={`
                    w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors
                    ${selectedSpender === 'Joint'
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }
                `}
            >
                <span>Joint Account</span>
                {selectedSpender === 'Joint' && <Check size={14} />}
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-3" />

            {members.map(member => (
                <button
                    key={member.id}
                    onClick={() => handleSelect(member.name)}
                    className={`
                        w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors
                        ${selectedSpender === member.name
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }
                    `}
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="w-2 h-2 rounded-full ring-1 ring-slate-200 dark:ring-slate-600"
                            style={{ backgroundColor: member.color }}
                        />
                        <span>{member.name}</span>
                    </div>
                    {selectedSpender === member.name && <Check size={14} />}
                </button>
            ))}
        </div>
    );
}
