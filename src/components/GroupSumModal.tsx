import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCalculator, FaArrowLeft, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { DataGrid, Column } from "react-data-grid";
import 'react-data-grid/lib/styles.css';
import { useTheme } from "@/context/ThemeContext";
import ExcelJS from 'exceljs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

interface GroupSumModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableColumns: string[];
    data: any[];
    rightList?: string[];
    leftAlignedColumns?: string[];
}

type ConfigRow = {
    id: string;
    columnName: string;
};

const GroupSumModal: React.FC<GroupSumModalProps> = ({
    isOpen,
    onClose,
    availableColumns,
    data,
    rightList = [],
    leftAlignedColumns = []
}) => {
    const { colors, fonts } = useTheme();

    // Normalize rightList and leftAlignedColumns for comparison
    const normalizedRightList = useMemo(() =>
        rightList.map(col => col.replace(/\s+/g, '').toLowerCase()),
        [rightList]
    );

    const normalizedLeftAlignedColumns = useMemo(() =>
        leftAlignedColumns.map(col => col.replace(/\s+/g, '').toLowerCase()),
        [leftAlignedColumns]
    );

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

    /* ---------------- Export Functions ---------------- */
    const exportToExcel = async () => {
        if (!resultData || resultData.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Grouped Data');

        // Get column headers
        const groupCols = Array.from(selectedGroup);
        const sumCols = Array.from(selectedSum);
        const headers = [
            ...groupCols.map(col => `${col} (Group)`),
            ...sumCols.map(col => `${col} (Total)`),
            'Count'
        ];

        // Add header row
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows
        resultData.forEach(row => {
            const rowData = [
                ...groupCols.map(col => row[`group_${col}`]),
                ...sumCols.map(col => typeof row[`sum_${col}`] === 'number' ? row[`sum_${col}`].toFixed(2) : row[`sum_${col}`]),
                row._count
            ];
            worksheet.addRow(rowData);
        });

        // Auto-size columns
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        // Generate file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grouped_data_${new Date().getTime()}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        if (!resultData || resultData.length === 0) return;

        const groupCols = Array.from(selectedGroup);
        const sumCols = Array.from(selectedSum);

        // Build table headers
        const tableHeaders = [
            ...groupCols.map(col => ({ text: `${col} (Group)`, style: 'tableHeader' })),
            ...sumCols.map(col => ({ text: `${col} (Total)`, style: 'tableHeader' })),
            { text: 'Count', style: 'tableHeader' }
        ];

        // Build table body
        const tableBody = resultData.map(row => {
            return [
                ...groupCols.map(col => row[`group_${col}`] || ''),
                ...sumCols.map(col => {
                    const val = row[`sum_${col}`];
                    return typeof val === 'number' ? val.toFixed(2) : val;
                }),
                row._count.toString()
            ];
        });

        // PDF document definition
        const docDefinition: any = {
            pageSize: 'A4',
            pageOrientation: groupCols.length + sumCols.length > 6 ? 'landscape' : 'portrait',
            content: [
                {
                    text: 'Grouped Data Report',
                    style: 'header',
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: Array(tableHeaders.length).fill('auto'),
                        body: [tableHeaders, ...tableBody]
                    },
                    layout: {
                        fillColor: (rowIndex: number) => {
                            return rowIndex === 0 ? '#4a5568' : (rowIndex % 2 === 0 ? '#f7fafc' : null);
                        },
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                        hLineColor: () => '#cbd5e0',
                        vLineColor: () => '#cbd5e0',
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    color: '#333'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 12,
                    color: 'white'
                }
            },
            defaultStyle: {
                fontSize: 10
            }
        };

        // Download PDF
        pdfMake.createPdf(docDefinition).download(`grouped_data_${new Date().getTime()}.pdf`);
    };

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
                            className="peer h-5 w-5 appearance-none rounded border-2 border-blue-600 bg-white checked:bg-blue-600 cursor-pointer focus:outline-none"
                        />
                        <span className="absolute text-white text-sm font-bold opacity-0 peer-checked:opacity-100 pointer-events-none">
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
                            className="peer h-5 w-5 appearance-none rounded border-2 border-green-600 bg-white checked:bg-green-600 cursor-pointer focus:outline-none"
                        />
                        <span className="absolute text-white text-sm font-bold opacity-0 peer-checked:opacity-100 pointer-events-none">
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

        // Helper function to check if column should be right-aligned
        const isRightAligned = (colName: string, colKey: string): boolean => {
            const normalizedColName = colName.replace(/\s+/g, '').toLowerCase();

            // First check if it's forced to be left-aligned (highest priority)
            if (normalizedLeftAlignedColumns.includes(normalizedColName)) {
                return false;
            }

            // Then check if it's in the API's rightList
            if (normalizedRightList.includes(normalizedColName)) {
                return true;
            }

            // Otherwise, detect if column is numeric based on data
            const sampleSize = Math.min(10, resultData.length);
            const sample = resultData.slice(0, sampleSize);

            let numericCount = 0;
            let validValuesCount = 0;

            for (const row of sample) {
                const value = row[colKey];
                if (value === null || value === undefined || value === '') continue;

                validValuesCount++;
                const rawValue = String(value);
                const cleanValue = rawValue.replace(/[,\s₹$€£¥]/g, '');
                const numValue = parseFloat(cleanValue);

                if (!isNaN(numValue)) {
                    numericCount++;
                }
            }

            return validValuesCount > 0 && numericCount / validValuesCount >= 0.7;
        };

        // Group Columns
        Array.from(selectedGroup).forEach(col => {
            const groupKey = `group_${col}`;
            const shouldRightAlign = isRightAligned(col, groupKey);

            cols.push({
                key: groupKey,
                name: col + " (Group)",
                resizable: true,
                renderCell: ({ row }) => (
                    <div
                        className="w-full h-full flex items-center px-2"
                        style={{
                            justifyContent: shouldRightAlign ? 'flex-end' : 'flex-start',
                            textAlign: shouldRightAlign ? 'right' : 'left'
                        }}
                    >
                        {row[groupKey]}
                    </div>
                )
            });
        });

        // Sum Columns - check API rightList first, then default to right align (since they're numeric)
        Array.from(selectedSum).forEach(col => {
            const sumKey = `sum_${col}`;
            const shouldRightAlign = isRightAligned(col, sumKey);

            cols.push({
                key: sumKey,
                name: col + " (Total)",
                resizable: true,
                renderCell: ({ row }) => (
                    <div
                        className="w-full h-full flex items-center px-2"
                        style={{
                            justifyContent: shouldRightAlign ? 'flex-end' : 'flex-start',
                            textAlign: shouldRightAlign ? 'right' : 'left'
                        }}
                        title={`Sum of ${row._count} records`}
                    >
                        {typeof row[sumKey] === 'number' ? row[sumKey].toFixed(2) : row[sumKey]}
                    </div>
                )
            });
        });

        return cols;
    }, [resultData, selectedGroup, selectedSum, normalizedRightList, normalizedLeftAlignedColumns]);


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
                <div className="p-4 border-t flex justify-between items-center gap-3">
                    <div className="flex gap-3">
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
                    </div>

                    <div className="flex gap-3">
                        {viewMode === 'result' && resultData && resultData.length > 0 && (
                            <>
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border hover:bg-gray-50"
                                    style={{ color: colors.text, borderColor: '#e5e7eb' }}
                                    title="Export to Excel"
                                >
                                    <FaFileExcel size={16} className="text-green-600" />
                                    Excel
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border hover:bg-gray-50"
                                    style={{ color: colors.text, borderColor: '#e5e7eb' }}
                                    title="Export to PDF"
                                >
                                    <FaFilePdf size={16} className="text-red-600" />
                                    PDF
                                </button>
                            </>
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
            </div>
        </div>,
        document.body
    );
};

export default GroupSumModal;
