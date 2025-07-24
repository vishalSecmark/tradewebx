import { useState, useEffect } from "react";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import { toast } from "react-toastify";
import { DataGrid } from "react-data-grid";
import Loader from "@/components/Loader";
import apiService from "@/utils/apiService";

interface DematLedgerData {
    ClientCode: string;
    ClientName: string;
    Date: string;
    voucherNo: string;
    Narration: string;
    DebitofCredit: string;
    ChequeNo: string;
    DebitAmount: number;
    CreditAmount: number;
    Balance: number;
    BalanceTag: string;
}

interface DematLedgerModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientCode: string;
    dpAccountNo: string;
}

const DematLedgerModal = ({ isOpen, onClose, clientCode, dpAccountNo }: DematLedgerModalProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DematLedgerData[]>([]);

    const columns = [
        { key: "Date", name: "Date" },
        { key: "voucherNo", name: "Voucher No" },
        { key: "Narration", name: "Narration" },
        { key: "DebitAmount", name: "Debit" },
        { key: "CreditAmount", name: "Credit" },
        { key: "Balance", name: "Balance" },
        { key: "BalanceTag", name: "Dr/Cr" }
    ];

    const fetchDematLedger = async () => {
        try {
            setLoading(true);
            const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"DPLedger","Level":1,"RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Filter><ClientCode>${clientCode}</ClientCode><BenefAccountNo>${dpAccountNo}</BenefAccountNo></X_Filter>
        <X_GFilter></X_GFilter>
        <J_Api>"UserId":"${clientCode}", "UserType":"user"</J_Api>
      </dsXml>`;

            const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

            if (response.data?.data?.rs0) {
                setData(response.data.data.rs0);
            } else {
                toast.error("Failed to fetch Demat ledger");
            }
        } catch (error) {
            console.error("Error fetching Demat ledger:", error);
            toast.error("Error fetching Demat ledger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDematLedger();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center gap-4 mt-2 mb-4">
                    <h4 className="text-xl font-semibold">
                        Demat Ledger Balance
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

export default DematLedgerModal;