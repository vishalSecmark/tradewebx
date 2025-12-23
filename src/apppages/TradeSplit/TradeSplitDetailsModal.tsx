import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DataGrid, Column, RenderCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import Select from 'react-select';
import moment from 'moment';
import _ from 'lodash';
import { useTheme } from '@/context/ThemeContext';
import apiService from '@/utils/apiService';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import { getLocalStorage } from '@/utils/helper';
import { TradeRow, DPOption, TradeSplitModalProps } from '@/types/tradeSplit';

// --- XML Builders ---
const buildSplitTradeXml = (summaryRow: any, tradeDate: string) => `
<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"SplitTrade","Level":1,"RequestFrom":"W"</J_Ui>
    <Sql></Sql>
    <X_Filter>
        <Client>${summaryRow.Client.trim()}</Client>
        <TradeDate>${moment(tradeDate).format('YYYYMMDD')}</TradeDate>
        <ReportType>DETAIL</ReportType>
        <Scrip>${summaryRow.Scrip}</Scrip>
        <SerialNo>${summaryRow.SerialNo}</SerialNo>
        <BuySell>${summaryRow.BuySell}</BuySell>
    </X_Filter>
    <X_GFilter></X_GFilter>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
</dsXml>
`;

const buildDpAccountXml = (clientCode: string, scrip: string, buySell: string) => `
<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"GetTradeDPAccountNo","Level":1,"RequestFrom":"W"</J_Ui>
    <Sql></Sql>
    <X_Filter><ClientCode>${clientCode.trim()}</ClientCode><Scrip>${scrip}</Scrip><BuySell>${buySell}</BuySell></X_Filter>
    <X_GFilter></X_GFilter>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
</dsXml>
`;

const buildSaveXml = (data: TradeRow[]) => {
    const payloadData = data.map(row => ({
        Scrip: row.Scrip,
        SerialNo: row.SerialNo,
        Client: row.Client,
        BuySell: row.BuySell,
        FinalQty: row.FinalQty,
        DPAccountNo: row.DPAccountNo
    }));

     return `
<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"SaveTradeSplit","Level":1,"RequestFrom":"W"</J_Ui>
    <Sql></Sql>
    <X_Filter></X_Filter>
    <X_GFilter></X_GFilter>
    <X_DataJson>${JSON.stringify(payloadData)}</X_DataJson>
    <J_Api>"UserId":"${getLocalStorage('userId')}", "UserType":"${getLocalStorage('userType')}"</J_Api>
</dsXml>
`;
};

const TradeSplitDetailsModal: React.FC<TradeSplitModalProps> = ({ isOpen, onClose, summaryRow, filters }) => {
    const { colors } = useTheme(); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<TradeRow[]>([]);
    const [dpOptionsMap, setDpOptionsMap] = useState<Record<string, DPOption[]>>({});
    const [loadingDpOptions, setLoadingDpOptions] = useState<Record<string, boolean>>({});
    
    // Status & Validation
    const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error' | 'success', text: string | React.ReactNode } | null>(null);
    const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (isOpen && summaryRow && filters?.TradeDate) {
            fetchDetails();
        } else {
            setRows([]);
            setStatusMessage(null);
            setRowErrors({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, summaryRow]); 

    const fetchDetails = async () => {
        setIsLoading(true);
        setStatusMessage(null);
        try {
            const xmlPayload = buildSplitTradeXml(summaryRow, filters.TradeDate);
            const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlPayload);
            const data = response?.data?.data?.rs0 || [];
            
            // Merge summary data (like Client Code) into detailed rows if missing, 
            // as we need Client code for DP Fetch and Saving.
            const initializedRows = data.map((d: any, index: number) => ({
                ...d,
                _id: d._id ?? index,
                FinalQty: d.FinalQty ?? 0,
                Client: d.Client || summaryRow.Client, // fallback to summary client
                Scrip: d.Scrip || summaryRow.Scrip,
                BuySell: d.BuySell || summaryRow.BuySell,
                SerialNo: d.SerialNo || summaryRow.SerialNo 
            }));
            
            setRows(initializedRows);

            if (initializedRows.length > 0) {
                const uniqueGroups = _.uniqBy(initializedRows, (r: TradeRow) => `${r.Scrip}-${r.SerialNo}`);
                uniqueGroups.forEach((group: any) => fetchDpOptions(group));
            }

        } catch (error) {
            console.error("Error fetching split details", error);
            setStatusMessage({ type: 'error', text: "Failed to load trade details." });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDpOptions = async (row: TradeRow) => {
        const key = `${row.Scrip}-${row.SerialNo}-${row.BuySell}`;
        if (dpOptionsMap[key]) return; 

        setLoadingDpOptions(prev => ({ ...prev, [key]: true }));
        try {
            const xmlPayload = buildDpAccountXml(row.Client, row.Scrip, row.BuySell);
            const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlPayload);
            const list = response?.data?.data?.rs0 || [];
             
            const options: DPOption[] = list.map((item: any) => ({
                label: item.DPAccontName || item.DisplayName || "Unknown",
                value: item.DPAccountNo || "",
                qty: item.HoldingQty !== undefined ? parseFloat(item.HoldingQty) : undefined
            }));

            setDpOptionsMap(prev => ({ ...prev, [key]: options }));
        } catch (error) {
            console.error(`Error fetching DP Options for ${key}`, error);
        } finally {
            setLoadingDpOptions(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleAddRow = () => {
        if (!rows.length) return; // Need at least one row to copy from
        
        const lastRow = rows[rows.length - 1];
        const newRow: TradeRow = {
            ...lastRow,
            _id: Math.max(...rows.map(r => r._id)) + 1, // Generate new ID
            FinalQty: 0,
            DPAccountNo: '', // Reset DP
            // Keep Metadata (Client, Scrip, etc.)
        };

        setRows([...rows, newRow]);
    };

    const handleRowChange = (rowId: number, field: string, value: any) => {
        setRows(prevRows => prevRows.map(r => r._id === rowId ? { ...r, [field]: value } : r));
        if (rowErrors[rowId]) {
            setRowErrors(prev => {
                const next = { ...prev };
                delete next[rowId];
                return next;
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMessage({ type: 'info', text: 'Validating and Saving...' });
        setRowErrors({});

        // Validation Logic
        const buySell = summaryRow.BuySell; // "S" or "B"
        const scrip = summaryRow.Scrip;
        const serial = summaryRow.SerialNo;
        const key = `${scrip}-${serial}-${buySell}`;

        const errors: string[] = []; // Changed to const as per ESLint rule (array ref is const)
        const newRowErrors: Record<number, string> = {}; // Changed to const

        const sumFinalQty = rows.reduce((sum, r) => sum + (Number(r.FinalQty) || 0), 0);

        if (buySell === 'S') {
            const sumSellQty = rows.reduce((sum, r) => sum + (Number(r.SellQty) || 0), 0); // Note: SellQty is per row? 
            // For split trades, the sum of FinalQty must match the ORIGINAL Total Sell Qty.
            // Since we Add Row which COPIES SellQty, simply summing rows.SellQty will be WRONG if we duplicated rows.
            // We should trust the `summaryRow.SellQty` as the Source of Truth for the total limit.
            
            const totalTargetQty = summaryRow.SellQty;

            if (sumFinalQty !== totalTargetQty) {
                errors.push(`Total Final Qty (${sumFinalQty}) MUST EQUAL Total Sell Qty (${totalTargetQty})`);
                rows.forEach(r => newRowErrors[r._id] = "Error");
            }
            
            // DP Qty Check & Duplicate Check
            const selectedDPs = new Set<string>();

            rows.forEach(row => {
                 // Skip check if no DP selected (will likely be needed for save but let's separate checks)
                 if (!row.DPAccountNo) return; 

                 if (selectedDPs.has(row.DPAccountNo)) {
                     errors.push(`Row #${row.SerialNo}: Duplicate DP Account selected (${row.DPAccountNo})`);
                     newRowErrors[row._id] = "Error";
                 }
                 selectedDPs.add(row.DPAccountNo);

                 const options = dpOptionsMap[key] || [];
                 const selected = options.find(o => o.value === row.DPAccountNo);
                 if (selected && selected.qty !== undefined) {
                     if (Number(row.FinalQty) > selected.qty) {
                         errors.push(`Row #${row.SerialNo}: Final Qty > DP Holding (${selected.qty})`);
                         newRowErrors[row._id] = "Error";
                     }
                 }
            });

        } else {
             // For Buy, trust SummaryRow as source of truth
             const totalTargetQty = summaryRow.BuyQty;
             
             if (sumFinalQty !== totalTargetQty) {
                 errors.push(`Total Final Qty (${sumFinalQty}) MUST EQUAL Total Buy Qty (${totalTargetQty})`);
                 rows.forEach(r => newRowErrors[r._id] = "Error");
             }
        }

        if (errors.length > 0) {
            setRowErrors(newRowErrors);
            setStatusMessage({ 
                type: 'error', 
                text: (
                    <ul className="list-disc pl-4">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                )
            });
            setIsSaving(false);
            return;
        }

        try {
            const xmlPayload = buildSaveXml(rows);
            console.log("Saving Modal Payload", xmlPayload);
            
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 500));
            // await apiService.postWithAuth(BASE_URL + PATH_URL, xmlPayload);

            setStatusMessage({ type: 'success', text: 'Saved successfully!' });
            
            // Close after short delay? Or let user close.
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (e) {
            console.error(e);
            setStatusMessage({ type: 'error', text: 'Error saving data.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Columns
    const columns: Column<TradeRow>[] = useMemo(() => {
        return [
            { key: 'SerialNo', name: 'Serial No', width: 90 },
            { 
              key: 'Settlement', 
              name: 'Settlement', 
              width: 100
            },
            { key: 'ClientName', name: 'Client Name', width: 200 },
            { key: 'Scrip', name: 'Scrip', width: 90 },
            { key: 'ScripName', name: 'Scrip Name', width: 150 },
            { key: 'BuySell', name: 'B/S', width: 50 },
            { key: 'BuyQty', name: 'Buy Qty', width: 80 },
            { key: 'SellQty', name: 'Sell Qty', width: 80 },
            {
                key: 'FinalQty',
                name: 'Final Qty',
                width: 120,
                renderCell: (props: RenderCellProps<TradeRow>) => {
                    const hasError = !!rowErrors[props.row._id];
                    return (
                        <input
                            className={`w-full px-2 py-1 border rounded bg-white ${hasError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                            type="number"
                            value={props.row.FinalQty}
                            onChange={(e) => handleRowChange(props.row._id, 'FinalQty', e.target.value)}
                            aria-label={`Final Quantity for row ${props.row.SerialNo}`}
                        />
                    );
                }
            },
            {
                key: 'DPAccountNo',
                name: 'DP Account No',
                width: 250,
                renderCell: (props: RenderCellProps<TradeRow>) => {
                    const row = props.row;
                    const hasError = !!rowErrors[row._id];
                    const key = `${row.Scrip}-${row.SerialNo}-${row.BuySell}`;
                    const options = dpOptionsMap[key] || [];
                    const isLoading = loadingDpOptions[key];
                    
                    return (
                        <div className={hasError ? "border border-red-500 rounded" : ""}>
                            <Select
                                options={options}
                                isLoading={isLoading}
                                value={options.find(o => o.value === row.DPAccountNo) || (row.DPAccountNo ? { label: row.DPAccountNo, value: row.DPAccountNo } : null)}
                                onChange={(val) => handleRowChange(row._id, 'DPAccountNo', val?.value)}
                                menuPortalTarget={document.body}
                                styles={{ 
                                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                                    control: base => ({ ...base, minHeight: 40, fontSize: 14, border: hasError ? 'none' : base.border })
                                }}
                                placeholder="Select DP..."
                                aria-label={`DP Account for row ${props.row.SerialNo}`}
                            />
                        </div>
                    );
                }
            }
        ];
    }, [rows, dpOptionsMap, loadingDpOptions, rowErrors]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                                    <span>Detailed Trade Split - {summaryRow?.ScripName} ({summaryRow?.Scrip})</span>
                                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                                        ✕
                                    </button>
                                </Dialog.Title>

                                <div className="mt-4">
                                    {/* Status Card */}
                                    {statusMessage && (
                                        <div className={`mb-4 p-3 rounded-md border text-sm font-medium ${
                                            statusMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                            statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                                            'bg-blue-50 border-blue-200 text-blue-700'
                                        }`}>
                                            {statusMessage.text}
                                        </div>
                                    )}

                                    {/* Grid */}
                                    <div className="h-[400px] border rounded overflow-hidden relative">
                                        {isLoading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                                Loading Details...
                                            </div>
                                        ) : (
                                            <DataGrid
                                                columns={columns}
                                                rows={rows}
                                                className="rdg-light fill-grid h-full"
                                                style={{ height: '100%' }}
                                                rowKeyGetter={(row) => row._id}
                                                rowHeight={50} // Increased height for dropdowns
                                            />
                                        )}
                                    </div>
                                    
                                    {/* Add Row Button */}
                                    <div className="mt-2 text-right">
                                         <button 
                                            type="button"
                                            onClick={handleAddRow}
                                            disabled={isLoading}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-semibold border border-green-300"
                                         >
                                            + Add Split Row
                                         </button>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={handleSave}
                                        disabled={isSaving || isLoading}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TradeSplitDetailsModal;
