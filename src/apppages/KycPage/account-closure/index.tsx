"use client";
import { selectAllMenuItems } from "@/redux/features/menuSlice";
import { useAppSelector } from "@/redux/hooks";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import { findPageData } from "@/utils/helper";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "@/context/ThemeContext";
import { FaExternalLinkAlt } from "react-icons/fa";
import DematHoldingModal from "./DematHolding";
import DematLedgerModal from "./DematLedgerBalance";
import TradingBalanceModal from "./TradingBalance";
import Loader from "@/components/Loader";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { CiSaveUp2 } from "react-icons/ci";
import apiService from "@/utils/apiService";


interface DPHolding {
  ISINCode: string;
  ISINName: string;
  Quantity: number;
  Type: string;
}

interface CMRAttachment {
  Attachment: string;
}

interface SignedPdf {
  Attachment: string;
}

interface ClientData {
  ClientCode: string;
  ClientName: string;
  Mobile: string;
  Email: string;
  TradingLedgerBalance: string;
  DPLedgerBalance: string;
  LastTradedDate: string;
  DPAcno: string;
  DPHoldingValue: string;
  DPHolding: DPHolding[];
  CMRAttachment: CMRAttachment[];
  SignedPdf: SignedPdf[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    rs0?: {
      Data?: ClientData;
      ClientCode?: string;
      Status?: string;
      Remark?: string;
    }[];
    rs1?: {
      Flag: string;
      Message: string;
    }[];
  };
  datarows?: string[];
}

const AccountClosure = () => {
  const { colors, fonts } = useTheme();
  const menuItems = useAppSelector(selectAllMenuItems);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closureType, setClosureType] = useState<"T" | "D" | "B" | null>(null);
  const [transferBalance, setTransferBalance] = useState(false);
  const [reason, setReason] = useState("");
  const [newBoid, setNewBoid] = useState("");
  const [cmrFile, setCmrFile] = useState<File | null>(null);

  // Modal states
  const [showDematHolding, setShowDematHolding] = useState(false);
  const [showDematLedger, setShowDematLedger] = useState(false);
  const [showTradingLedger, setShowTradingLedger] = useState(false);

  const pageData = findPageData(menuItems, "ClientClosure");

  // Helper functions to parse balance values
  const parseBalance = (balance: string) => {
    if (!balance) return 0;
    const num = parseFloat(balance.replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.abs(num);
  };

  const hasTradingBalance = parseBalance(data?.TradingLedgerBalance || "0") > 0;
  const hasDematBalance = parseBalance(data?.DPLedgerBalance || "0") > 0;
  const hasHoldingValue = parseBalance(data?.DPHoldingValue || "0") > 0;

  const handleGetData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!pageData || !pageData.length || !pageData[0].levels || !pageData[0].levels.length) {
        throw new Error("Page configuration data not found");
      }
      const page = pageData[0].levels[0];
      const J_Ui = page.J_Ui
        ? Object.entries(page.J_Ui)
          .map(([key, value]) => `"${key}":"${value}"`)
          .join(",")
        : "";

      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found in local storage");

      const authToken = document.cookie.split("auth_token=")[1];
      if (!authToken) throw new Error("Authentication token not found");

      const xmlData = `<dsXml>
        <J_Ui>${J_Ui}</J_Ui>
        <Sql></Sql>
        <X_Filter></X_Filter>
        <X_Filter_Multiple></X_Filter_Multiple>
        <J_Api>"UserId":"${userId}"</J_Api>
      </dsXml>`;

      const response = await apiService.postWithAuth(`${BASE_URL}${PATH_URL}`, xmlData);

      if (!response.success) {
        throw new Error(response.message || "API request failed");
      }

      const responseData = response.data.data?.rs0?.[0]?.Data;
      if (!responseData) {
        throw new Error("No data received from API");
      }
      setData(responseData)
      // setData({
      //   ...responseData,
      //   TradingLedgerBalance : 0,
      //   DPLedgerBalance : 0,
      //   DPHoldingValue:0
      // });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  const handleCMRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCmrFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (parseBalance(data.TradingLedgerBalance) || parseBalance(data.DPLedgerBalance)) {
      toast.warning("You have balance in your Accounts")
      return;
    }
    if (!reason) {
      toast.error("Please provide reason for account closure");
      return;
    }

    if ((closureType === "D" || closureType === "B") && hasHoldingValue && !newBoid) {
      toast.error("Please provide Transfer BOID for holdings transfer");
      return;
    }

    if ((closureType === "D" || closureType === "B") && hasHoldingValue && !cmrFile) {
      toast.error("Please upload CMR Form for holdings transfer");
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "";

      const payload = {
        ClientCode: data?.ClientCode || "",
        DPAcNo: data?.DPAcno || "",
        ClosureType: closureType,
        ClosureReason: reason,
        CMRAttachment: cmrFile ? "File attached" : "",
        BOID: newBoid,
        HoldingBalance: data?.DPHoldingValue || "0"
      };

      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"MakerClientClosure","RequestFrom":"W"</J_Ui>
        <Sql/>
        <X_Filter/>
        <X_Filter_Multiple><EntryName>Account closure</EntryName></X_Filter_Multiple>
        <X_DataJson>${JSON.stringify(payload)}</X_DataJson>
        <J_Api>"UserId":"${userId}"</J_Api>
      </dsXml>`;

      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      if (response.success) {
        toast.success("Account closure request submitted successfully");
      } else {
        toast.error(response.message || "Failed to submit account closure request");
      }
    } catch (error) {
      console.error("Error submitting account closure:", error);
      toast.error("Error submitting account closure request");
    } finally {
      setLoading(false);
    }
  };

  // Auto-enable transfer fields when needed
  useEffect(() => {
    if ((closureType === "D" || closureType === "B") && hasHoldingValue) {
      setTransferBalance(true);
    } else {
      setTransferBalance(false);
    }
  }, [closureType, hasHoldingValue]);

  if (loading) {
    return (
      <div className="flex inset-0 flex items-center justify-center z-[200] h-[100vh]">
        <Loader />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8">
        Error: {error}
        <button
          onClick={handleGetData}
          className="ml-4 px-4 py-2 rounded hover:bg-blue-600"
          style={{
            backgroundColor: colors.buttonBackground,
            color: colors.buttonText
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div
        className="text-center py-8"
        style={{ color: colors.text }}
      >
        No account closure data available
      </div>
    );
  }

  return (
    <div
      className="container mx-auto p-2 pt-0"
      style={{
        color: colors.text,
        fontFamily: fonts.content
      }}
    >
      {/* Modals */}
      <DematHoldingModal
        isOpen={showDematHolding}
        onClose={() => setShowDematHolding(false)}
        clientCode={data.ClientCode}
        dpAccountNo={data.DPAcno}
      />

      <DematLedgerModal
        isOpen={showDematLedger}
        onClose={() => setShowDematLedger(false)}
        clientCode={data.ClientCode}
        dpAccountNo={data.DPAcno}
      />

      <TradingBalanceModal
        isOpen={showTradingLedger}
        onClose={() => setShowTradingLedger(false)}
        clientCode={data.ClientCode}
      />

      {/* Header with Submit Button */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">
          Account Closure
        </h1>
        <button
          type="submit"
          form="closureForm"
          className="py-2 px-4 rounded text-white font-semibold flex items-center"
          style={{
            backgroundColor: colors.buttonBackground,
            color: colors.buttonText
          }}
        >
          Submit Request
          <CiSaveUp2 className="ml-2" />
        </button>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Trading Account Card */}
        <div
          style={{ backgroundColor: colors.cardBackground }}
          className="p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Trading Account</h3>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">{data.ClientCode ?? "--"}</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span
                className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                onClick={() => setShowTradingLedger(true)}
              >
                Ledger Balance: <FaExternalLinkAlt className="text-sm" />
              </span>
              <span className={`font-semibold ${(data.TradingLedgerBalance || '').includes('-')
                ? 'text-red-600'
                : 'text-green-600'
                }`}>
                {data.TradingLedgerBalance ?? "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Demat Account Card */}
        <div
          style={{ backgroundColor: colors.cardBackground }}
          className="p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Demat Account</h3>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">{data.DPAcno ?? "--"}</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span
                className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                onClick={() => setShowDematLedger(true)}
              >
                Ledger Balance: <FaExternalLinkAlt className="text-sm" />
              </span>
              <span className={`font-semibold ${(data.DPLedgerBalance || '').includes('-')
                ? 'text-red-600'
                : 'text-green-600'
                }`}>
                {data.DPLedgerBalance ?? "--"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                onClick={() => setShowDematHolding(true)}
              >
                Holding Value: <FaExternalLinkAlt className="text-sm" />
              </span>
              <span className=
                {`font-semibold ${(data.DPHoldingValue || '').includes('-')
                  ? 'text-red-600'
                  : 'text-green-600'
                  }`}
              >{data.DPHoldingValue ?? "--"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form
        id="closureForm"
        className="rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white mb-4"
        onSubmit={handleSubmit}
      >
        {/* Left Section */}
        <div>
          {/* Closure Radio Buttons */}
          <div className="mb-3 space-y-4">
            <label className={`flex items-center p-3 rounded-lg border border-gray-200 transition-colors ${hasTradingBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}>
              <input
                type="radio"
                className="form-radio h-5 w-5 text-blue-600"
                name="closureType"
                value="T"
                checked={closureType === "T"}
                onChange={() => setClosureType("T")}
                disabled={hasTradingBalance}
              />
              <span className="ml-3 font-medium">Close Trading Account ({data.ClientCode ?? "--"})</span>
            </label>

            <label className={`flex items-center p-3 rounded-lg border border-gray-200 transition-colors ${hasDematBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}>
              <input
                type="radio"
                className="form-radio h-5 w-5 text-blue-600"
                name="closureType"
                value="D"
                checked={closureType === "D"}
                onChange={() => setClosureType("D")}
                disabled={hasDematBalance}
              />
              <span className="ml-3 font-medium">Close Demat Account ({data.DPAcno ?? "--"})</span>
            </label>

            <label className={`flex items-center p-3 rounded-lg border border-gray-200 transition-colors ${hasTradingBalance || hasDematBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}>
              <input
                type="radio"
                className="form-radio h-5 w-5 text-blue-600"
                name="closureType"
                value="B"
                checked={closureType === "B"}
                onChange={() => setClosureType("B")}
                disabled={hasTradingBalance || hasDematBalance}
              />
              <span className="ml-3 font-medium">Close Both</span>
            </label>
          </div>

          {/* Reason for account closure */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Reason for Account Closure:</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px] text-sm focus:ring focus:ring-opacity-50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{
                color: colors.text,
                borderColor: colors.buttonBackground
              }}
            />
          </div>
        </div>

        {/* Right Section */}
        <div>
          {/* Transfer Balance Checkbox */}
          <div className="mb-4">
            <label className={`inline-flex items-center p-3 rounded-lg border border-gray-200 transition-colors ${(closureType === "D" || closureType === "B") && hasHoldingValue ? 'cursor-pointer hover:border-blue-500' : 'opacity-50 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 rounded"
                checked={transferBalance}
                onChange={(e) => {
                  if ((closureType === "D" || closureType === "B") && hasHoldingValue) {
                    setTransferBalance(e.target.checked);
                  }
                }}
                disabled={!((closureType === "D" || closureType === "B") && hasHoldingValue)}
              />
              <span className="ml-2 font-medium">Transfer Holdings to Another Account</span>
            </label>
          </div>

          {/* New BOID Input */}
          {transferBalance && (
            <div className="mb-4">
              <label className="block font-medium mb-1">Transfer to BOID:</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:ring focus:ring-opacity-50"
                placeholder="Enter new BOID"
                value={newBoid}
                onChange={(e) => setNewBoid(e.target.value)}
                required={(closureType === "D" || closureType === "B") && hasHoldingValue}
                style={{
                  color: colors.text,
                  borderColor: colors.buttonBackground
                }}
              />
            </div>
          )}

          {/* CMR Upload */}
          {transferBalance && (
            <div className="mb-2">
              <label className="block font-medium mb-1">Upload CMR Form:</label>
              <div className="flex items-center">
                <label className="cursor-pointer">
                  <span
                    className="py-2 px-4 rounded mr-2 text-white flex items-center"
                    style={{
                      backgroundColor: colors.buttonBackground,
                      color: colors.buttonText
                    }}
                  >
                    <MdOutlineDriveFolderUpload className="mr-2" />
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleCMRUpload}
                    className="hidden"
                    required={(closureType === "D" || closureType === "B") && hasHoldingValue}
                  />
                </label>
                {cmrFile && (
                  <span className="text-sm truncate max-w-xs ml-2">
                    {cmrFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload scanned copy of Client Master Report</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AccountClosure;