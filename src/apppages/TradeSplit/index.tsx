import { selectAllMenuItems } from '@/redux/features/menuSlice';
import { useAppSelector } from '@/redux/hooks';
import { findPageData } from '@/utils/helper';
import React, { useEffect, useState, useMemo } from 'react';
import { DataGrid, Column, RenderCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import TradeSplitDetailsModal from './TradeSplitDetailsModal';
import { TradeSplitProps, SummaryRow } from '@/types/tradeSplit';

// ------------------- Component -------------------

const TradeSplit: React.FC<TradeSplitProps> = ({ data, settings, filters }) => {
    
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
            { key: 'SerialNo', name: 'Serial No', width: 90 },
            { key: 'Settlement', name: 'Settlement', width: 100 },
            { key: 'Client', name: 'Client Code', width: 100 },
            { key: 'ClientName', name: 'Client Name', width: 200 },
            { key: 'Scrip', name: 'Scrip Code', width: 90 },
            { key: 'ScripName', name: 'Scrip Name', width: 150 },
            { key: 'BuySell', name: 'B/S', width: 60 },
            { key: 'BuyQty', name: 'Buy Qty', width: 90 },
            { key: 'SellQty', name: 'Sell Qty', width: 90 },
        ];
    }, [selectedRowId]);

    return (
        <div className="w-full p-4 flex flex-col h-screen max-h-[calc(100vh-100px)]">
            
            {/* Top Bar */}
            <div className="bg-white p-4 shadow-sm rounded-lg mb-4 flex justify-between items-center border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700">Trade Split Summary</h2>
                <div>
                    <button
                        onClick={handleEditClick}
                        disabled={!selectedRow}
                        className={`px-4 py-2 font-semibold rounded shadow-sm transition-colors ${
                            selectedRow 
                             ? 'bg-blue-600 text-white hover:bg-blue-700' 
                             : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        aria-disabled={!selectedRow}
                    >
                        Edit Selected Trade
                    </button>
                </div>
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