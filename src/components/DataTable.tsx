"use client";
import React, { useMemo, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useAppSelector } from '@/redux/hooks';
import { RootState } from '@/redux/store';
import moment from 'moment';

interface DataTableProps {
    data: any[];
    settings?: any;
    onRowClick?: (record: any) => void;
}

interface DecimalColumn {
    key: string;
    decimalPlaces: number;
}

interface ValueBasedColor {
    key: string;
    checkNumber: number;
    lessThanColor: string;
    greaterThanColor: string;
    equalToColor: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, settings, onRowClick }) => {
    console.log(settings, 'settings');
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

    // Format date function
    const formatDateValue = (value: string | number | Date, format: string = 'DD-MM-YYYY'): string => {
        if (!value) return '';

        try {
            // Parse the YYYYMMDD format
            const momentDate = moment(value.toString(), 'YYYYMMDD');

            // Check if the date is valid
            if (!momentDate.isValid()) {
                // Try parsing as a regular date string
                const fallbackDate = moment(value);
                return fallbackDate.isValid() ? fallbackDate.format(format) : '';
            }

            return momentDate.format(format);
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // New decimal formatting function
    const formatDecimalValue = (value: number | string, decimalPlaces: number): string => {
        if (value === null || value === undefined || value === '') {
            return '';
        }

        try {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return numValue.toFixed(decimalPlaces);
        } catch (error) {
            console.error('Error formatting decimal:', error);
            return value.toString();
        }
    };

    // New function to get color based on value comparison
    const getValueBasedColor = (
        value: number | string,
        colorRule: ValueBasedColor
    ): string => {
        if (value === null || value === undefined || value === '') {
            return ''; // Default color
        }

        try {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;

            if (isNaN(numValue)) {
                return ''; // Default color for non-numeric values
            }

            if (numValue < colorRule.checkNumber) {
                return colorRule.lessThanColor;
            } else if (numValue > colorRule.checkNumber) {
                return colorRule.greaterThanColor;
            } else {
                return colorRule.equalToColor;
            }
        } catch (error) {
            console.error('Error determining value-based color:', error);
            return ''; // Default color on error
        }
    };

    // Process and format the data
    const formattedData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return data;
        }

        return data.map(row => {
            const newRow = { ...row };

            // Handle date formatting
            if (settings?.dateFormat?.key) {
                const dateColumns = settings.dateFormat.key.split(',').map((key: any) => key.trim());
                const dateFormat = settings.dateFormat.format;

                dateColumns.forEach((column: any) => {
                    if (newRow.hasOwnProperty(column)) {
                        newRow[column] = formatDateValue(newRow[column], dateFormat);
                    }
                });
            }

            // Handle decimal formatting
            if (settings?.decimalColumns && Array.isArray(settings.decimalColumns)) {
                settings.decimalColumns.forEach((decimalSetting: DecimalColumn) => {
                    if (decimalSetting.key) {
                        const decimalColumns = decimalSetting.key.split(',').map((key: any) => key.trim());

                        decimalColumns.forEach((column: any) => {
                            if (newRow.hasOwnProperty(column)) {
                                newRow[column] = formatDecimalValue(newRow[column], decimalSetting.decimalPlaces);
                            }
                        });
                    }
                });
            }

            // Handle value-based text colors
            if (settings?.valueBasedTextColor) {
                settings.valueBasedTextColor.forEach((colorRule: any) => {
                    const columns = colorRule.key.split(',').map((key: any) => key.trim());
                    columns.forEach((column: any) => {
                        if (newRow.hasOwnProperty(column)) {
                            const color = getValueBasedColor(newRow[column], colorRule);
                            if (color) {
                                newRow[column] = <div style={{ color }}>{newRow[column]}</div>;
                            }
                        }
                    });
                });
            }

            return newRow;
        });
    }, [data, settings?.dateFormat, settings?.decimalColumns, settings?.valueBasedTextColor]);

    // Dynamically create columns from the first data item
    const columns = useMemo(() => {
        if (!formattedData || formattedData.length === 0) return [];

        return Object.keys(formattedData[0]).map((key: any) => ({
            key,
            name: key,
            sortable: true,
            // width: getColumnWidth(key, formattedData),
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
    }, [formattedData, colors.text]);

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
        return sortRows(formattedData, sortColumns);
    }, [formattedData, sortColumns]);

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