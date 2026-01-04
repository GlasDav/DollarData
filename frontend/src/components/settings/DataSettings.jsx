import React, { useRef, useState } from 'react';
import { toLocalISOString } from '../../utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Download, Upload, Trash2, ShieldAlert } from 'lucide-react';
import * as api from '../../services/api';

export default function DataSettings() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [importStatus, setImportStatus] = useState(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImportStatus("Importing...");
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.importTransactions(formData);
            setImportStatus("Import successful!");
            queryClient.invalidateQueries(['transactions']);
            setTimeout(() => setImportStatus(null), 3000);
        } catch (error) {
            console.error(error);
            setImportStatus(`Error: ${error.message}`);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await api.exportData();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `principal_export_${toLocalISOString(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed");
        }
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                    <Save size={20} />
                </div>
                <div>
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">Data Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Import, export, or delete your data</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* JSON Export/Import */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-4">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Backup & Restore</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleExport}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 transition group"
                        >
                            <Download size={18} className="text-slate-400 group-hover:text-indigo-500 transition" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Export JSON Backup</span>
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-200 transition group"
                            >
                                <Upload size={18} className="text-slate-400 group-hover:text-emerald-500 transition" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {importStatus || "Restore from JSON"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* CSV/PDF Link */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Advanced Import/Export</h3>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                            Import bank statements (PDF/CSV) or export transaction history.
                        </p>
                    </div>
                    <a
                        href="/data-management"
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                        Go to Data Management
                    </a>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-red-600 mb-4 flex items-center gap-2">
                        <ShieldAlert size={16} /> Danger Zone
                    </h3>

                    <button className="w-full md:w-auto px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition flex items-center gap-2">
                        <Trash2 size={16} />
                        Delete All Transactions (Coming Soon)
                    </button>
                </div>
            </div>
        </section>
    );
}
