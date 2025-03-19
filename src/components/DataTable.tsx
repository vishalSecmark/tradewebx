"use client";
import React, { useMemo, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useTheme } from '@/context/ThemeContext';

interface DataTableProps {
    data: any[];
    settings?: any;
}

const DataTable: React.FC<DataTableProps> = ({ data, settings }) => {
    const { colors } = useTheme();
    const [sortColumns, setSortColumns] = useState<any[]>([]);

    // Dynamically create columns from the first data item
    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];

        return Object.keys(data[0]).map(key => ({
            key,
            name: key,
            sortable: true,
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
                rowHeight={40}
                headerRowHeight={45}
                style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                }}
            />
            <style jsx global>{`
                .rdg {
                    block-size: 100%;
                    border: 1px solid ${colors.textInputBorder};
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

                .rdg-row:nth-child(even) {
                    background-color: ${colors.evenCardBackground};
                }

                .rdg-row:nth-child(odd) {
                    background-color: ${colors.oddCardBackground};
                }

                .rdg-row:hover {
                    background-color: ${colors.color1};
                }
            `}</style>
        </div>
    );
};

export default DataTable; 