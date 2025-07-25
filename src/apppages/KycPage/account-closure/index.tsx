"use client";
import { selectAllMenuItems } from "@/redux/features/menuSlice";
import { useAppSelector } from "@/redux/hooks";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import { displayAndDownloadPDF, findPageData } from "@/utils/helper";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTheme } from "@/context/ThemeContext";
import { FaExternalLinkAlt, FaFilePdf } from "react-icons/fa";
import DematHoldingModal from "./DematHolding";
import DematLedgerModal from "./DematLedgerBalance";
import TradingBalanceModal from "./TradingBalance";
import Loader from "@/components/Loader";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { CiSaveUp2 } from "react-icons/ci";
import apiService from "@/utils/apiService";
import { useRouter, useSearchParams } from "next/navigation";

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfData, setPdfData] = useState<any>(null);

  console.log("check CRM FIle",cmrFile)
  // Validation errors
  const [errors, setErrors] = useState({
    closureType: "",
    reason: "",
    newBoid: "",
    cmrFile: ""
  });

  // Modal states
  const [showDematHolding, setShowDematHolding] = useState(false);
  const [showDematLedger, setShowDematLedger] = useState(false);
  const [showTradingLedger, setShowTradingLedger] = useState(false);
  const [genPDF, setGenPDF] = useState(false);
  const [viewFinalEsignPDF, setViewFinalEsignPDF] = useState(false);

  const pageData = findPageData(menuItems, "ClientClosure");

  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const id = searchParams.get('id');
  const signerIdentifier = searchParams.get('signerIdentifier');
  const esp = searchParams.get('esp');

  // Helper functions to parse balance values
  const parseBalance = (balance: string) => {
    if (!balance) return 0;
    const num = parseFloat(balance.replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.abs(num);
  };

  const hasTradingBalance = parseBalance(data?.TradingLedgerBalance || "0") > 0;
  const hasDematBalance = parseBalance(data?.DPLedgerBalance || "0") > 0;
  const hasHoldingValue = parseBalance(data?.DPHoldingValue || "0") > 0;


  const fileToBase64 = (file: File): Promise<string> => {
    console.log("check file",file)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      closureType: "",
      reason: "",
      newBoid: "",
      cmrFile: ""
    };

    if (!closureType) {
      newErrors.closureType = "Please select an account closure type";
    }

    if (!reason) {
      newErrors.reason = "Please provide a reason for account closure";
    }

    if ((closureType === "D" || closureType === "B") && hasHoldingValue && transferBalance && !newBoid) {
      newErrors.newBoid = "Please provide Transfer BOID for holdings transfer";
    }

    if ((closureType === "D" || closureType === "B") && hasHoldingValue && transferBalance && !cmrFile) {
      newErrors.cmrFile = "Please upload CMR Form for holdings transfer";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === "");
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    if (!closureType || !reason) return false;
    if ((closureType === "D" || closureType === "B") && hasHoldingValue && transferBalance) {
      if (!newBoid || !cmrFile) return false;
    }
    return true;
  };

  const handleGenerateClosurePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const userId = localStorage.getItem('userId') || '';
      const clientCode = data?.ClientCode || '';

      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"CLOSUREPDF","RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Filter></X_Filter>
        <X_Filter_Multiple><ClientCode>${clientCode}</ClientCode><EntryName>Account closure</EntryName></X_Filter_Multiple>
        <J_Api>"UserId":"${userId}"</J_Api>
      </dsXml>`;

      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);
      console.log(response)

      if (response.data?.data?.rs0?.[0]?.Flag === 'E') {
        await handleGenerateRekycPdf('CLOSUREPDF');
      } else if (response.data?.data?.rs0?.Base64PDF) {
        const pdfData = response.data.data.rs0;
        console.log(pdfData)
        displayAndDownloadPDF(pdfData?.Base64PDF, pdfData?.PDFName || 'AccountClosure.pdf');
        setPdfData(pdfData);

        toast.success("PDF will download in the background");
      } else {
        toast.error("Failed to generate account closure PDF");
      }
    } catch (error) {
      console.error("Error generating account closure PDF:", error);
      toast.error("Error generating account closure PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateRekycPdf = async (reportName: string) => {
    try {
      const userId = localStorage.getItem('clientCode') || '';
      const clientCode = data?.ClientCode || '';
      const entryName = 'REKYC';

      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"TradeWeb","Option":"GenerateRekycPDF","RequestFrom":"W","ReportDisplay":"D"</J_Ui>
        <Sql></Sql>
        <X_Filter></X_Filter>
        <X_Filter_Multiple></X_Filter_Multiple>
        <X_Data>
          <ReportName>${reportName}</ReportName>
          <EntryName>${entryName}</EntryName>
          <ClientCode>${clientCode}</ClientCode>
        </X_Data>
        <J_Api>"UserId":"${userId}"</J_Api>
      </dsXml>`;

      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      if (response.data?.data?.rs0?.[0]?.Base64PDF) {
        const pdfData = response.data.data.rs0[0];
        displayAndDownloadPDF(pdfData?.Base64PDF, pdfData?.PDFName || 'AccountClosure.pdf');
        setPdfData(pdfData);
        toast.success("Account closure PDF generated successfully");
      } else {
        toast.error(`Failed to generate ${reportName} PDF`);
      }
    } catch (error) {
      console.error(`Error generating ${reportName} PDF:`, error);
      toast.error(`Error generating ${reportName} PDF`);
    }
  };

  const handleGetData = async () => {
    if (!pageData || !pageData.length || !pageData[0].levels || !pageData[0].levels.length) {
        return ;
      }
    setLoading(true);
    setError(null);

    try {
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

      if (!response.data.success) {
        throw new Error(response.data.message || "API request failed");
      }

      const responseData = response.data.data?.rs0?.[0]?.Data;
      if (!responseData) {
        throw new Error("No data received from API");
      }
      //  setData(responseData)
        setData({
        ...responseData,
        TradingLedgerBalance: "0",
        DPLedgerBalance: "0",
        DPHoldingValue: "1"
      });
      if(responseData?.ViewFlag === "true"){
        setGenPDF(true)
      }
      if(responseData?.FINALPDFFlag === "true"){
        setViewFinalEsignPDF(true);
      }
      else{
        setGenPDF(false)
      }
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
      setErrors(prev => ({...prev, cmrFile: ""}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Additional validation
    if (parseBalance(data?.TradingLedgerBalance || "0") > 0 || parseBalance(data?.DPLedgerBalance || "0") > 0) {
      toast.warning("You have balance in your Accounts");
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "";

       let cmrBase64 = "";
      if (cmrFile) {
        try {
          cmrBase64 = await fileToBase64(cmrFile);
        } catch (error) {
          console.error("Error converting file to base64:", error);
          toast.error("Error processing uploaded file");
          return;
        }
      }

     const payload = {
        ClientCode: data?.ClientCode || "",
        DPAcNo: data?.DPAcno || "",
        ClosureType: closureType,
        ClosureReason: reason,
        CMRAttachment: cmrBase64,
        BOID: newBoid,
        HoldingBalance: data?.DPHoldingValue || "0",
        FileName: cmrFile?.name || ""
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
      const statusFlag = response.data.data.rs0[0]?.Status;
      const remark = response.data.data.rs0[0]?.Remark;

      if (response.data?.success) {
        if (statusFlag === "Y") {
          toast.success(remark || "Request submitted successfully");
          setGenPDF(true);
        } else {
          toast.success(remark || "Request submitted successfully");
        }
      } else {
        toast.error(response.data?.message || "Failed to submit account closure request");
      }
    } catch (error) {
      console.error("Error submitting account closure:", error);
      toast.error("Error submitting account closure request");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalESign = async () => {
    if (!pdfData) {
      toast.error("No Final PDF available for E-Sign");
      return;
    }

    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') || 'ADMIN';

      const J_Ui = {
        ActionName: "Rekyc",
        Option: "EsignRequest"
      };
      const Sql = null;
      const X_Filter = "";
      const X_Filter_Multiple = {
        ClientCode: userId,
        base64: pdfData.Base64PDF,
        pdfpage: pdfData.TotalPages.toString(),
        FileType: "FINALPDF"
      };
      const J_Api = {
        UserId: userId
      };

      let xFilterMultiple = '';
      Object.entries(X_Filter_Multiple).forEach(([key, value]) => {
        xFilterMultiple += `<${key}>${value}</${key}>`;
      });

      const jUi = Object.entries(J_Ui).map(([key, value]) => `"${key}":"${value}"`).join(',');
      const jApi = Object.entries(J_Api).map(([key, value]) => `"${key}":"${value}"`).join(',');

      const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${Sql || ''}</Sql>
                <X_Filter>${X_Filter}</X_Filter>
                <X_Filter_Multiple>${xFilterMultiple}</X_Filter_Multiple>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      if (response.data?.success) {
        const columnData = response.data?.data?.rs0?.[0]?.Column1;
        if (columnData) {
          try {
            // Parse the XML string to extract the Url
            const parser = new DOMParser();
            const doc = parser.parseFromString(columnData, 'text/html');
            const url = doc.querySelector('Url')?.textContent;
            if (url) {
              localStorage.setItem("ClosureredirectedField", "ClosureFinalEsign");
              window.open(url, '_self');
              return;
            }
            else {
              toast.error("No URL found in E-Sign response");
            }
          } catch (err) {
            console.error("Error parsing E-Sign response:", err);
            toast.error("Error processing Final E-Sign response");
          }
        }
      } else {
        toast.error(response.data?.message || "Failed to initiate Final E-Sign");
      }
    } catch (error) {
      console.error("Error during Final E-Sign:", error);
      toast.error("Error during Final E-Sign");
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

  const handleKRACallBack = async (reportName: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'ADMIN';
      const entryName = 'REKYC';
      const clientCode = userId;

      const xmlData = `<dsXml>
            <J_Ui>"ActionName":"REKYC","Option":"GetEsignDocument","RequestFrom":"W"</J_Ui>
            <Sql></Sql>
            <X_Filter></X_Filter>
            <X_Filter_Multiple></X_Filter_Multiple>
            <X_Data>
                <FileType>${reportName}</FileType>
                <EntryName>${entryName}</EntryName>
                <ClientCode>${clientCode}</ClientCode>
            </X_Data>
            <J_Api>"UserId":"${userId}"</J_Api>
        </dsXml>`;

      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      if (response.data?.data?.rs0) {
        localStorage.removeItem("ClosureredirectedField");

        // Extract message from XML string in Column1
        const column1Data = response.data.data.rs0[0].Column1;
        const messageMatch = column1Data.match(/<Message>(.*?)<\/Message>/);
        const flagMatch = column1Data.match(/<Flag>(.*?)<\/Flag>/);

        const message = messageMatch ? messageMatch[1] : "Operation completed";
        const flag = flagMatch ? flagMatch[1] : "S";

        if (flag === "S") {
          toast.success(message);
          setViewFinalEsignPDF(true);
          setGenPDF(true)
        } else {
          toast.error(message);
        }
        console.log("PDF Data:", response.data.data.rs0);
      } else {
        toast.error(`Failed to generate ${reportName} PDF`);
      }
    } catch (error) {
      console.error(`Error generating ${reportName} PDF:`, error);
      toast.error(`Error generating ${reportName} PDF`);
    }
  }

  // Handle E-Sign callback
  useEffect(() => {
    if (success === 'true' && id && signerIdentifier && esp) {
      handleKRACallBack("FINALPDF")
      router.replace(window.location.pathname);
    }
  }, [success, id, signerIdentifier, esp]);

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

        <div className="flex gap-2">
          {genPDF ? (
            <>
              {(pdfData || viewFinalEsignPDF) ? (
                <button
                  onClick={handleGenerateClosurePdf}
                  className="py-2 px-4 rounded text-white flex items-center"
                  style={{
                    backgroundColor: colors.buttonBackground,
                    color: colors.buttonText
                  }}
                  disabled={isGeneratingPdf}
                >
                  {viewFinalEsignPDF ? "View E-signed PDF" : "View PDF"} 
                  <FaFilePdf className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleGenerateClosurePdf}
                  className="py-2 px-4 rounded text-white flex items-center"
                  style={{
                    backgroundColor: colors.buttonBackground,
                    color: colors.buttonText
                  }}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? 'Generating...' : 'Gen PDF'}
                  <FaFilePdf className="ml-2" />
                </button>
              )}
            </>) : (
              <button
                type="submit"
                form="closureForm"
                className="py-2 px-4 rounded text-white flex items-center"
                style={{
                  backgroundColor: !isFormValid() ? "lightgrey" : colors.buttonBackground,
                  color: !isFormValid() ? "black" : colors.buttonText
                }}
                disabled={!isFormValid() || isGeneratingPdf}
              >
                Submit
                <CiSaveUp2 className="ml-2" />
              </button>
            )}

          {pdfData && !viewFinalEsignPDF && (
            <button
              type="button"
              form="closureForm"
              className="py-2 px-4 rounded text-white flex items-center"
              style={{
                backgroundColor: colors.buttonBackground,
                color: colors.buttonText
              }}
              onClick={handleFinalESign}
              disabled={isGeneratingPdf}
            >
              E-sign
            </button>
          )}
        </div>
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
                onChange={() => {
                  setClosureType("T");
                  setErrors(prev => ({...prev, closureType: ""}));
                }}
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
                onChange={() => {
                  setClosureType("D");
                  setErrors(prev => ({...prev, closureType: ""}));
                }}
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
                onChange={() => {
                  setClosureType("B");
                  setErrors(prev => ({...prev, closureType: ""}));
                }}
                disabled={hasTradingBalance || hasDematBalance}
              />
              <span className="ml-3 font-medium">Close Both</span>
            </label>
            {errors.closureType && (
              <div className="text-red-500 text-sm mt-1">{errors.closureType}</div>
            )}
          </div>

          {/* Reason for account closure */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Reason for Account Closure:</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px] text-sm focus:ring focus:ring-opacity-50"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors(prev => ({...prev, reason: ""}));
              }}
              required
              style={{
                color: colors.text,
                borderColor: colors.buttonBackground
              }}
            />
            {errors.reason && (
              <div className="text-red-500 text-sm mt-1">{errors.reason}</div>
            )}
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
                onChange={(e) => {
                  setNewBoid(e.target.value);
                  setErrors(prev => ({...prev, newBoid: ""}));
                }}
                required={(closureType === "D" || closureType === "B") && hasHoldingValue}
                style={{
                  color: colors.text,
                  borderColor: colors.buttonBackground
                }}
              />
              {errors.newBoid && (
                <div className="text-red-500 text-sm mt-1">{errors.newBoid}</div>
              )}
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
                  />
                </label>
                {cmrFile && (
                  <span className="text-sm truncate max-w-xs ml-2">
                    {cmrFile.name}
                  </span>
                )}
              </div>
              {errors.cmrFile && (
                <div className="text-red-500 text-sm mt-1">{errors.cmrFile}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">Upload scanned copy of Client Master Report</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AccountClosure;