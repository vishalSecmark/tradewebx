"use client";
import React, { useMemo, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';

interface DataTableProps {
    data: any[];
    settings?: any;
    onRowClick?: (record: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, settings, onRowClick }) => {
    const { colors } = useTheme();
    const [sortColumns, setSortColumns] = useState<any[]>([]);
    const { tableStyle } = useAppSelector((state: RootState) => state.common);
    console.log(tableStyle);
    const rowHeight = tableStyle === 'small' ? 30 : tableStyle === 'medium' ? 40 : 50;
    // Calculate minimum column width based on content
    const getColumnWidth = (key: string, rows: any[]) => {
        // Start with the header length (plus some padding)
        let maxWidth = key.length * 10 + 32;

        // Check all row values
        rows.forEach(row => {
            const value = row[key];
            const valueString = value?.toString() || '';
            // Calculate based on content type
            if (typeof value === 'number') {
                // For numbers, use a fixed width or calculate based on digits
                maxWidth = Math.max(maxWidth, valueString.length * 10 + 24);
            } else {
                // For text, calculate based on character length
                maxWidth = Math.max(maxWidth, Math.min(valueString.length * 8 + 24, 300));
            }
        });

        return maxWidth;
    };

    // Dynamically create columns from the first data item
    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];

        return Object.keys(data[0]).map(key => ({
            key,
            name: key,
            sortable: true,
            // width: getColumnWidth(key, data),
            minWidth: 80,
            maxWidth: 400,
            resizable: true,
            formatter: (props: any) => {
                const value = props.row[key];
                // Check if the value is numeric
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // Format number with commas and 2 decimal places
                    const formattedValue = new Intl.NumberFormat('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(numValue);

                    // Determine text color based on value
                    const textColor = numValue < 0 ? '#dc2626' :
                        numValue > 0 ? '#16a34a' :
                            colors.text;

                    return <div style={{ color: textColor }}>{formattedValue}</div>;
                }
                return value;
            }
        }));
    }, [data, colors.text]);

    // Sort function
    const sortRows = (initialRows: any[], sortColumns: any[]) => {
        if (sortColumns.length === 0) return initialRows;

        return [...initialRows].sort((a, b) => {
            for (const sort of sortColumns) {
                const { columnKey, direction } = sort;
                const aValue = a[columnKey];
                const bValue = b[columnKey];

                // Convert to numbers if possible for comparison
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    if (aNum !== bNum) {
                        return direction === 'ASC' ? aNum - bNum : bNum - aNum;
                    }
                } else {
                    const comparison = aValue.localeCompare(bValue);
                    if (comparison !== 0) {
                        return direction === 'ASC' ? comparison : -comparison;
                    }
                }
            }
            return 0;
        });
    };

    const rows = useMemo(() => {
        return sortRows(data, sortColumns);
    }, [data, sortColumns]);

    return (
        <div style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
            <DataGrid
                columns={columns}
                rows={rows}
                sortColumns={sortColumns}
                onSortColumnsChange={setSortColumns}
                className="rdg-light"
                rowHeight={rowHeight}
                headerRowHeight={rowHeight}
                style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                }}
                onCellClick={(props: any) => {
                    if (onRowClick) {
                        onRowClick(rows[props.rowIdx]);
                    }
                }}
            />
            <style jsx global>{`
                .rdg {
                    block-size: 100%;
                    border: 1px solid ${colors.textInputBorder};
                    --rdg-header-background-color: ${colors.primary};
                    --rdg-header-row-color: ${colors.buttonText};
                    --rdg-background-color: ${colors.background};
                    --rdg-row-hover-background-color: ${colors.color1};
                }
                
                .rdg-header-row {
                    background-color: ${colors.primary};
                    color: ${colors.buttonText};
                    font-weight: 600;
                }

                .rdg-cell {
                    border-right: 1px solid ${colors.textInputBorder};
                    border-bottom: 1px solid ${colors.textInputBorder};
                    padding: 0 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: ${colors.text};
                }

                .rdg-row {
                    cursor: ${onRowClick ? 'pointer' : 'default'};
                }

                .rdg-row:nth-child(even) {
                    background-color: ${colors.evenCardBackground};
                }

                .rdg-row:nth-child(odd) {
                    background-color: ${colors.oddCardBackground};
                }

                .rdg-row:hover {
                    background-color: ${colors.color1} !important;
                }

                .rdg-header-sort-cell {
                    cursor: pointer;
                }

                .rdg-header-sort-cell:hover {
                    background-color: ${colors.primary}dd;
                }
            `}</style>
        </div>
    );
};

export default DataTable; 