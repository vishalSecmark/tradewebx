import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import { toast } from "react-toastify";
import { DataGrid } from "react-data-grid";
import Loader from "@/components/Loader";

interface TradingLedgerData {
    Date: string;
    Voucher: string;
    "Cheque No": string;
    Particular: string;
    Debit: string;
    Credit: string;
    Balance: string;
    Flag: string;
    LookUp: string;
}

interface TradingBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientCode: string;
}

const TradingBalanceModal = ({ isOpen, onClose, clientCode }: TradingBalanceModalProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TradingLedgerData[]>([]);

    const getCurrentFinancialYearDates = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Financial year runs from April 1 to March 31
        let fromDate, toDate;

        if (currentMonth >= 3) { // April or later
            fromDate = `${currentYear}0401`; // April 1 of current year
            toDate = `${currentYear + 1}0331`; // March 31 of next year
        } else { // January-March
            fromDate = `${currentYear - 1}0401`; // April 1 of previous year
            toDate = `${currentYear}0331`; // March 31 of current year
        }

        return { fromDate, toDate };
    };

    const columns = [
        { key: "Date", name: "Date" },
        { key: "Voucher", name: "Voucher" },
        { key: "Cheque No", name: "Cheque No" },
        { key: "Particular", name: "Particular" },
        { key: "Debit", name: "Debit" },
        { key: "Credit", name: "Credit" },
        { key: "Balance", name: "Balance" },
        { key: "Flag", name: "Dr/Cr" }
    ];

    const fetchTradingLedger = async () => {
        try {
            setLoading(true);
            const { fromDate, toDate } = getCurrentFinancialYearDates();

            const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"Ledger","Level":1,"RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Filter><FromDate>${fromDate}</FromDate><ToDate>${toDate}</ToDate><ClientCode>${clientCode}</ClientCode></X_Filter>
        <X_GFilter></X_GFilter>
        <J_Api>"UserId":"${clientCode}", "UserType":"user"</J_Api>
      </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.data?.rs0) {
                setData(response.data.data.rs0);
            } else {
                toast.error("Failed to fetch trading ledger");
            }
        } catch (error) {
            console.error("Error fetching trading ledger:", error);
            toast.error("Error fetching trading ledger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTradingLedger();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center gap-4 mt-2 mb-4">
                    <h4 className="text-xl font-semibold">
                        Trading Account Ledger
                    </h4>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex inset-0 flex items-center justify-center z-[200] max-h-[80vh]">
                        <Loader />
                    </div>
                ) : (
                    <div className="h-[70vh]">
                        <DataGrid
                            columns={columns}
                            rows={data}
                            className="rdg-light border-0"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingBalanceModal;