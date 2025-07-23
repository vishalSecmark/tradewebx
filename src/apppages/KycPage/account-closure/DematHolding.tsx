import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import { toast } from "react-toastify";
import { DataGrid } from "react-data-grid";
import Loader from "@/components/Loader";

interface DematHoldingData {
    ClientCode: string;
    ClientName: string;
    ISINName: string;
    ISIN: string;
    BalanceType: string;
    Qty: number;
    Rate: number;
    Value: number;
}

interface DematHoldingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientCode: string;
    dpAccountNo: string;
}

const DematHoldingModal = ({ isOpen, onClose, clientCode, dpAccountNo }: DematHoldingModalProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DematHoldingData[]>([]);

    const columns = [
        { key: "ISIN", name: "ISIN" },
        { key: "ISINName", name: "Security Name" },
        { key: "BalanceType", name: "Type" },
        { key: "Qty", name: "Quantity" },
        { key: "Rate", name: "Rate" },
        { key: "Value", name: "Value" }
    ];

    const fetchDematHoldings = async () => {
        try {
            setLoading(true);
            const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"DPHolding","Level":1,"RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Filter><ClientCode>${clientCode}</ClientCode><BenefAccountNo>${dpAccountNo}</BenefAccountNo><ReportType>UPTODATE</ReportType></X_Filter>
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
                toast.error("Failed to fetch Demat holdings");
            }
        } catch (error) {
            console.error("Error fetching Demat holdings:", error);
            toast.error("Error fetching Demat holdings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDematHoldings();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center gap-4 mt-2 mb-4">
                    <h4 className="text-xl font-semibold">
                        Demat Holdings
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

export default DematHoldingModal;