import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCalculator, FaArrowLeft } from "react-icons/fa";
import { DataGrid, Column } from "react-data-grid";
import 'react-data-grid/lib/styles.css';
import { useTheme } from "@/context/ThemeContext";

interface GroupSumModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableColumns: string[];
    data: any[];
}

type ConfigRow = {
    id: string;
    columnName: string;
};

const GroupSumModal: React.FC<GroupSumModalProps> = ({
    isOpen,
    onClose,
    availableColumns,
    data
}) => {
    const { colors, fonts } = useTheme();

    const [selectedGroup, setSelectedGroup] = useState<Set<string>>(new Set());
    const [selectedSum, setSelectedSum] = useState<Set<string>>(new Set());
    const [resultData, setResultData] = useState<any[] | null>(null);
    const [viewMode, setViewMode] = useState<'config' | 'result'>('config');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setViewMode('config');
            setResultData(null);
            // Optional: reset selections or keep them? Keeping them is usually better UX.
            // If we want to persist selections, we'd need to lift state up or use localstorage.
            // For now, let's keep them in component state so they persist while the parent component is mounted.
        }
    }, [isOpen]);

    /* ---------------- Logic ---------------- */
    const [isCalculating, setIsCalculating] = useState(false);

    /* ---------------- Logic ---------------- */
    const calculateResults = () => {
        if (selectedGroup.size === 0) {
            alert("Please select at least one column to group by (Select Column).");
            return;
        }

        setIsCalculating(true);

        setTimeout(() => {
            try {
                const groups: Record<string, any> = {};
                const groupCols = Array.from(selectedGroup);
                const sumCols = Array.from(selectedSum);

                data.forEach(row => {
                    // Create a unique key for the group (normalize: remove whitespace)
                    const keyParts = groupCols.map(col => {
                        const val = row[col];
                        return (val === null || val === undefined) ? '' : String(val).trim();
                    });
                    const key = keyParts.join('|||');

                    if (!groups[key]) {
                        groups[key] = {
                            _count: 0,
                            _key: key,
                        };
                        // Initialize group columns
                        groupCols.forEach((col) => {
                            groups[key][`group_${col}`] = row[col];
                        });
                        // Initialize sum columns
                        sumCols.forEach(col => {
                            groups[key][`sum_${col}`] = 0;
                        });
                    }

                    // Increment count
                    groups[key]._count += 1;

                    // Add values for sum
                    sumCols.forEach(col => {
                        let val = 0;
                        const rawVal = row[col];

                        if (typeof rawVal === 'number') {
                            val = rawVal;
                        } else if (typeof rawVal === 'string') {
                            const cleanVal = rawVal.replace(/[,\s₹$€£¥]/g, '');
                            const parsed = parseFloat(cleanVal);
                            if (!isNaN(parsed)) val = parsed;
                        }

                        groups[key][`sum_${col}`] += val;
                    });
                });

                // Calculate means (averages) for each group
                const results = Object.values(groups).map(group => {
                    const result = { ...group };
                    sumCols.forEach(col => {
                        const sumKey = `sum_${col}`;
                        const meanKey = `mean_${col}`;
                        // Calculate mean
                        result[meanKey] = group._count > 0 ? result[sumKey] / group._count : 0;
                    });
                    return result;
                });
                setResultData(results);
                setViewMode('result');
            } catch (err) {
                console.error("Calculation Error", err);
            } finally {
                setIsCalculating(false);
            }
        }, 50);
    };

    /* ---------------- Config View Columns ---------------- */
    const configRows: ConfigRow[] = useMemo(
        () =>
            availableColumns.map(col => ({
                id: col,
                columnName: col
            })),
        [availableColumns]
    );

    const toggleGroup = (col: string) => {
        setSelectedGroup(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    };

    const toggleSum = (col: string) => {
        setSelectedSum(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    };

    const configColumns: Column<ConfigRow>[] = useMemo(
        () => [
            {
                key: "columnName",
                name: "Column Name",
                resizable: true
            },
            {
                key: "group",
                name: "Select Column (Group)",
                width: 180,
                renderCell: ({ row }) => (
                    <label className="relative inline-flex items-center justify-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedGroup.has(row.id)}
                            onChange={() => toggleGroup(row.id)}
                            className="peer h-5 w-5 appearance-none rounded border-2 border-blue-600 bg-white cursor-pointer focus:outline-none"
                        />
                        <span className="absolute text-blue-600 text-sm font-bold opacity-0 peer-checked:opacity-100 pointer-events-none">
                            ✓
                        </span>
                    </label>
                )
            },
            {
                key: "sum",
                name: "SUM Column",
                width: 150,
                renderCell: ({ row }) => (
                    <label className="relative inline-flex items-center justify-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedSum.has(row.id)}
                            onChange={() => toggleSum(row.id)}
                            className="peer h-5 w-5 appearance-none rounded border-2 border-green-600 bg-white cursor-pointer focus:outline-none"
                        />
                        {/* Green tick for sum */}
                        <span className="absolute text-green-600 text-sm font-bold opacity-0 peer-checked:opacity-100 pointer-events-none">
                            ✓
                        </span>
                    </label>
                )
            }
        ],
        [selectedGroup, selectedSum]
    );

    /* ---------------- Result View Columns ---------------- */
    const resultColumns: Column<any>[] = useMemo(() => {
        if (!resultData || resultData.length === 0) return [];

        const cols: Column<any>[] = [];

        // Group Columns
        Array.from(selectedGroup).forEach(col => {
            cols.push({
                key: `group_${col}`,
                name: col + " (Group)",
                resizable: true
            });
        });

        // Sum Columns - show total only
        Array.from(selectedSum).forEach(col => {
            const sumKey = `sum_${col}`;

            cols.push({
                key: sumKey,
                name: col + " (Total)",
                resizable: true,
                renderCell: ({ row }) => (
                    <div title={`Sum of ${row._count} records`} className="cursor-help w-full h-full flex items-center">
                        {typeof row[sumKey] === 'number' ? row[sumKey].toFixed(2) : row[sumKey]}
                        <span className="ml-2 text-xs text-gray-400">({row._count})</span>
                    </div>
                )
            });
        });

        return cols;
    }, [resultData, selectedGroup, selectedSum]);


    /* ---------------- Render Guard ---------------- */
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 flex flex-col max-h-[90vh]"
                style={{ backgroundColor: colors.cardBackground, color: colors.text }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 style={{ color: colors.text }} className="text-xl font-semibold">
                        {viewMode === 'config' ? 'Group & Sum Configuration' : 'Grouped Results'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 relative">
                    {isCalculating && (
                        <div className="absolute inset-0 z-50 bg-white/50 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <span className="mt-2 text-sm text-blue-600 font-semibold">Calculating...</span>
                            </div>
                        </div>
                    )}
                    {viewMode === 'config' ? (
                        <>
                            <p className="text-sm text-gray-500 mb-3">
                                Select columns to group by and columns to calculate totals.
                            </p>
                            <div className="border rounded-lg h-full min-h-[400px] overflow-y-auto">
                                <DataGrid
                                    columns={configColumns}
                                    rows={configRows}
                                    rowKeyGetter={(row) => row.id}
                                    style={{
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        fontFamily: fonts.content,
                                        height: '100%'
                                    }}
                                    className="rdg-light"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="border rounded-lg" style={{ height: '500px' }}>
                            {resultData && resultData.length > 0 ? (
                                <DataGrid
                                    columns={resultColumns}
                                    rows={resultData}
                                    rowKeyGetter={(row: any) => row._key}
                                    style={{
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                        fontFamily: fonts.content,
                                        height: '500px'
                                    }}
                                    className="rdg-light"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    No results generated.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3">
                    {viewMode === 'result' ? (
                        <button
                            onClick={() => setViewMode('config')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 border"
                            style={{ color: colors.text, borderColor: '#e5e7eb' }}
                        >
                            <FaArrowLeft size={14} />
                            Back to Configuration
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                            style={{ color: colors.text, backgroundColor: colors.buttonBackground }}
                        >
                            Cancel
                        </button>
                    )}

                    {viewMode === 'config' && (
                        <button
                            onClick={calculateResults}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm text-white"
                            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText || '#fff' }}
                        >
                            <FaCalculator size={14} />
                            Calculate Totals
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GroupSumModal;
