import React, { useEffect, useState, useMemo } from 'react';
import { DataGrid, Column, RenderCellProps } from 'react-data-grid';
import TradeSplitDetailsModal from './TradeSplitDetailsModal';
import { TradeSplitProps, SummaryRow } from '@/types/tradeSplit';
import { useTheme } from '@/context/ThemeContext';

// ------------------- Component -------------------

const TradeSplit: React.FC<TradeSplitProps> = ({ data, settings, filters }) => {
    const {colors} = useTheme();
    // State
    const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initialize
    useEffect(() => {
        if (data) {
            const initializedRows = data.map((d, index) => ({
                ...d,
                _id: d._id ?? index, 
            }));
            setSummaryRows(initializedRows);
        }
    }, [data]);

    // Derived Selection
    const selectedRow = useMemo(() => {
        return summaryRows.find(r => r._id === selectedRowId) || null;
    }, [summaryRows, selectedRowId]);


    // Handlers
    const handleRadioChange = (id: number) => {
        setSelectedRowId(id);
    };

    const handleEditClick = () => {
        if (selectedRow) {
            setIsModalOpen(true);
        }
    };

    // Columns
    const columns: Column<SummaryRow>[] = useMemo(() => {
        return [
            {
                key: 'select',
                name: 'Select',
                width: 60,
                frozen: true,
                renderCell: (props: RenderCellProps<SummaryRow>) => (
                    <div className="flex justify-center items-center h-full">
                        <input
                            type="radio"
                            name="tradeSplitRowSelection"
                            checked={props.row._id === selectedRowId}
                            onChange={() => handleRadioChange(props.row._id)}
                            className="cursor-pointer w-4 h-4 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select row ${props.row.SerialNo}`}
                        />
                    </div>
                )
            },
            { key: 'SerialNo', name: 'Serial No', width: "auto" },
            { key: 'Settlement', name: 'Settlement', width: "auto" },
            { key: 'Client', name: 'Client Code', width: "auto" },
            { key: 'ClientName', name: 'Client Name', width: "auto" },
            { key: 'Scrip', name: 'Scrip Code', width: "auto" },
            { key: 'ScripName', name: 'Scrip Name', width: "auto" },
            { key: 'BuySell', name: 'B/S', width: "auto" },
            { key: 'BuyQty', name: 'Buy Qty', width: "auto" },
            { key: 'SellQty', name: 'Sell Qty', width: "auto" },
        ];
    }, [selectedRowId]);

    return (
        <div className="w-full p-2 flex flex-col h-screen max-h-[calc(100vh-100px)]">
            {/* Top Bar - Button Right Aligned */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleEditClick}
                    disabled={!selectedRow}
                    className={`px-4 py-2 font-semibold rounded shadow-sm transition-colors text-white`}
                    style={{
                        backgroundColor: selectedRow ? (colors?.buttonBackground || '#2563eb') : '#e5e7eb',
                        borderColor: selectedRow ? (colors?.buttonBackground || '#2563eb') : '#d1d5db',
                        color: selectedRow ?     (colors?.buttonText || '#ffffff') : '#9ca3af',
                        cursor: selectedRow ? 'pointer' : 'not-allowed'
                    }}
                    aria-disabled={!selectedRow}
                >
                    Edit Selected Trade
                </button>
            </div>
            {/* Grid */}
            <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                <DataGrid
                    columns={columns}
                    rows={summaryRows}
                    className="rdg-light fill-grid h-full"
                    style={{ height: '100%' }}
                    rowKeyGetter={(row) => row._id}
                />
            </div>

            {/* Details Modal */}
            <TradeSplitDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                summaryRow={selectedRow}
                filters={filters}
            />
        </div>
    );
};

export default TradeSplit;