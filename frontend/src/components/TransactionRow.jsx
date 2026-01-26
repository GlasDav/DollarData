import React, { memo } from 'react';
import { Pencil, Split, StickyNote, BookPlus, UserCheck, ChevronDown } from 'lucide-react';
import CategorySelectOptions from './filters/CategorySelectOptions';

const TransactionRow = memo(({
    txn,
    selectedIds,
    editingCell,
    buckets,
    members,
    assignDropdownId,
    onToggleSelect,
    onSetEditingCell,
    onUpdate,
    onSplit,
    onNote,
    onRule,
    onAssignDropdown,
    onAssign
}) => {
    // Helper handlers to prevent recreating inline functions for every cell
    const handleDateBlur = (e) => {
        if (e.target.value && e.target.value !== txn.date.split('T')[0]) {
            onUpdate({ id: txn.id, date: e.target.value });
        }
        onSetEditingCell({ id: null, field: null });
    };

    const handleDescriptionBlur = (e) => {
        if (e.target.value !== txn.description) {
            onUpdate({ id: txn.id, description: e.target.value });
        }
        onSetEditingCell({ id: null, field: null });
    };

    const handleAmountBlur = (e) => {
        const newAmount = parseFloat(e.target.value);
        // Preserve sign (expense vs income)
        const originalSign = txn.amount < 0 ? -1 : 1;
        const finalAmount = Math.abs(newAmount) * originalSign;

        if (finalAmount !== txn.amount && !isNaN(newAmount)) {
            onUpdate({ id: txn.id, amount: finalAmount });
        }
        onSetEditingCell({ id: null, field: null });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') onSetEditingCell({ id: null, field: null });
    };

    const isDateEditing = editingCell.id === txn.id && editingCell.field === 'date';
    const isDescEditing = editingCell.id === txn.id && editingCell.field === 'description';
    const isAmountEditing = editingCell.id === txn.id && editingCell.field === 'amount';

    return (
        <tr className="hover:bg-surface dark:hover:bg-surface-dark/50 transition group">
            <td className="px-3 py-3">
                <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary"
                    checked={selectedIds.has(txn.id)}
                    onChange={() => onToggleSelect(txn.id)}
                />
            </td>

            {/* DATE CELL */}
            <td className="px-3 py-3 text-sm text-text-primary dark:text-text-primary-dark font-mono" onClick={() => onSetEditingCell({ id: txn.id, field: 'date' })}>
                {isDateEditing ? (
                    <input
                        autoFocus
                        type="date"
                        defaultValue={txn.date.split('T')[0]}
                        onBlur={handleDateBlur}
                        onKeyDown={handleKeyDown}
                        className="bg-surface dark:bg-surface-dark border-0 rounded px-1 py-0.5 text-xs w-full focus:ring-2 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="cursor-pointer hover:underline decoration-dashed decoration-text-muted underline-offset-4">
                        {new Date(txn.date).toLocaleDateString('en-AU')}
                    </span>
                )}
            </td>

            {/* DESCRIPTION CELL */}
            <td className="px-3 py-3 text-sm text-text-secondary dark:text-text-secondary-dark group/cell max-w-[400px]" onClick={() => onSetEditingCell({ id: txn.id, field: 'description' })}>
                {isDescEditing ? (
                    <input
                        autoFocus
                        type="text"
                        defaultValue={txn.description}
                        onBlur={handleDescriptionBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-surface dark:bg-surface-dark border-0 rounded px-2 py-1 text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary font-medium"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer" title={`Original: ${txn.raw_description}`}>
                        <span className="font-medium text-text-primary dark:text-text-primary-dark truncate block hover:underline decoration-dashed decoration-text-muted underline-offset-4">{txn.description}</span>
                        <Pencil size={14} className="text-text-muted opacity-0 group-hover/cell:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                )}
            </td>

            {/* CATEGORY CELL */}
            <td className="px-3 py-3">
                <select
                    className="bg-transparent hover:bg-surface-hover dark:hover:bg-surface-dark-hover dark:focus:bg-card-dark rounded px-2 py-1 text-sm text-text-primary dark:text-text-primary-dark border-none focus:ring-2 focus:ring-primary cursor-pointer max-w-[250px] truncate"
                    value={txn.bucket_id || ""}
                    onChange={(e) => onUpdate({ id: txn.id, bucket_id: parseInt(e.target.value), is_verified: true })}
                    onClick={(e) => e.stopPropagation()}
                >
                    <CategorySelectOptions buckets={buckets} />
                </select>
            </td>

            {/* SPENDER CELL */}
            <td className="px-3 py-3">
                <select
                    className="bg-transparent hover:bg-surface-hover dark:hover:bg-surface-dark-hover dark:focus:bg-card-dark rounded px-2 py-1 text-sm text-text-primary dark:text-text-primary-dark border-none focus:ring-2 focus:ring-primary cursor-pointer max-w-[140px] truncate"
                    value={txn.spender || "Joint"}
                    onChange={(e) => onUpdate({ id: txn.id, spender: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="Joint" className="dark:bg-card-dark dark:text-text-primary-dark">Joint</option>
                    {members.map(member => (
                        <option key={member.id} value={member.name} className="dark:bg-card-dark dark:text-text-primary-dark">{member.name}</option>
                    ))}
                </select>
            </td>

            {/* ACTIONS CELL */}
            <td className="px-3 py-3 w-24">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onSplit(txn)}
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition"
                        title="Split Transaction"
                    >
                        <Split size={14} />
                    </button>
                    <button
                        onClick={() => onNote(txn)}
                        className={`p-1.5 rounded transition ${txn.notes ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' : 'text-text-muted hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'}`}
                        title={txn.notes || "Add Note"}
                    >
                        <StickyNote size={14} className={txn.notes ? "fill-yellow-600/20" : ""} />
                    </button>
                    <button
                        onClick={() => onRule(txn)}
                        className="p-1.5 text-text-muted hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition"
                        title="Create Rule from Transaction"
                    >
                        <BookPlus size={14} />
                    </button>
                    {members.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => onAssignDropdown(assignDropdownId === txn.id ? null : txn.id)}
                                className={`p-1.5 rounded transition ${txn.assigned_to ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'text-text-muted hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}
                                title={txn.assigned_to ? `Assigned to ${txn.assigned_to}` : 'Assign for Review'}
                            >
                                <UserCheck size={14} />
                            </button>
                            {assignDropdownId === txn.id && (
                                <div className="absolute top-full right-0 mt-1 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                                    <button
                                        onClick={() => { onAssign({ id: txn.id, assigned_to: '' }); onAssignDropdown(null); }}
                                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover dark:hover:bg-surface-dark-hover text-text-secondary dark:text-text-secondary-dark"
                                    >
                                        None
                                    </button>
                                    {members.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => { onAssign({ id: txn.id, assigned_to: member.name }); onAssignDropdown(null); }}
                                            className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-hover dark:hover:bg-surface-dark-hover flex items-center gap-2 ${txn.assigned_to === member.name ? 'text-orange-600 font-medium' : ''}`}
                                        >
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }}></span>
                                            {member.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </td>

            {/* AMOUNT CELL */}
            <td
                className={`px-3 pr-6 py-3 text-sm font-semibold text-right cursor-pointer group/amount`}
                onClick={() => onSetEditingCell({ id: txn.id, field: 'amount' })}
            >
                {isAmountEditing ? (
                    <input
                        autoFocus
                        type="number"
                        step="0.01"
                        defaultValue={Math.abs(txn.amount)}
                        onBlur={handleAmountBlur}
                        onKeyDown={handleKeyDown}
                        className="w-24 bg-surface dark:bg-surface-dark border-0 rounded px-1 py-0.5 text-right text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-primary text-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`${txn.amount < 0 ? 'text-text-primary dark:text-text-primary-dark' : 'text-emerald-600'} hover:underline decoration-dashed decoration-text-muted underline-offset-4`}>
                        ${Math.abs(txn.amount).toFixed(2)}
                    </span>
                )}
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (do NOT re-render)
    // Returns false if props are different (DO re-render)

    // 1. Transaction data change
    if (prevProps.txn !== nextProps.txn) return false;

    // 2. Selection state change
    const wasSelected = prevProps.selectedIds.has(prevProps.txn.id);
    const isSelected = nextProps.selectedIds.has(nextProps.txn.id);
    if (wasSelected !== isSelected) return false;

    // 3. Editing state change
    // Only re-render if *this specific row* was or is editing, OR if we're entering/leaving edit mode generally? 
    // Actually, simple equality check on editingCell object is unsafe if it is mutated, but here it's replaced.
    // We only care if:
    // a) editingCell.id matched this row before match
    // b) editingCell.id matches this row now
    // If editingCell changes from {id: OTHER} to {id: OTHER2}, THIS row shouldn't re-render
    const wasEditing = prevProps.editingCell.id === prevProps.txn.id;
    const isEditing = nextProps.editingCell.id === nextProps.txn.id;
    if (wasEditing || isEditing) {
        // deep check if field changed
        if (prevProps.editingCell.id !== nextProps.editingCell.id || prevProps.editingCell.field !== nextProps.editingCell.field) return false;
    }

    // 4. Assign dropdown state
    const wasDropdown = prevProps.assignDropdownId === prevProps.txn.id;
    const isDropdown = nextProps.assignDropdownId === nextProps.txn.id;
    if (wasDropdown !== isDropdown) return false;

    // 5. Global data changes (buckets/members) - usually ref stability is enough if React Query manages it well
    if (prevProps.buckets !== nextProps.buckets) return false;
    if (prevProps.members !== nextProps.members) return false;

    return true;
});

export default TransactionRow;
