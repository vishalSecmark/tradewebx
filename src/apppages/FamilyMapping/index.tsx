"use client";
import { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { DataGrid, Column } from "react-data-grid";
import { Modal } from "@/components/ui/modal";
import axios from "axios";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
import { useTheme } from "@/context/ThemeContext";
import { getLocalStorage } from "@/utils/helper";
import { FamilyRow, LoginData } from "@/types/FamilyTypes";
import { BASE_URL, OTP_VERIFICATION_URL, PRODUCT, ACTION_NAME } from "@/utils/constants";

const passKey = "TradeWebX1234567";

export default function Family() {
  const { colors } = useTheme();

  // --- States ---
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [isUccModalOpen, setIsUccModalOpen] = useState<boolean>(false);
  const [ucc, setUcc] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<LoginData>({ userId: "", password: "" });
  const [otp, setOtp] = useState<string>("");
  const [otpRequired, setOtpRequired] = useState<boolean>(false);
  const [loginMessage, setLoginMessage] = useState<string>("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // --- Columns ---
  const columns: Column<FamilyRow>[] = [
    { key: "FamilyHead", name: "Family Head" },
    { key: "ClientCode", name: "Client Code" },
    { key: "ClientName", name: "Client Name" },
  ];

  // --- AES Encryption ---
  function Encryption(data: string): string {
    const key = CryptoJS.enc.Utf8.parse(passKey);
    const iv = CryptoJS.enc.Utf8.parse(passKey);
    return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), key, {
      keySize: 128 / 8,
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  }

  // --- Get IP Address ---
  const getIPAddress = async (): Promise<string> => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error("Ipify failed");
      const data = await res.json();
      return data.ip;
    } catch {
      toast.error(" Ipify lookup failed, using backup service...");
      try {
        const backupRes = await fetch("https://ipapi.co/json/");
        if (!backupRes.ok) throw new Error("ipapi failed");
        const backupData = await backupRes.json();
        toast.success(" Backup API worked!");
        return backupData.ip;
      } catch {
        toast.error("All IP lookups failed!");
        return "0.0.0.0"; // Last fallback if everything fails
      }
    }
  };

  // --- Fetch Family Mapping ---
  const fetchFamilyMapping = async (): Promise<void> => {
    try {
      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"${ACTION_NAME}","Option":"FamilyMapping","RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Filter></X_Filter>
        <X_Filter_Multiple></X_Filter_Multiple>
        <X_Data></X_Data>
        <J_Api>"UserId":"${getLocalStorage("userId")}"</J_Api>
      </dsXml>`;

      const response = await axios.post(BASE_URL + OTP_VERIFICATION_URL, xmlData, {
        headers: { "Content-Type": "application/xml" },
      });

      if (response.data?.data?.rs0?.length) {
        const formattedRows: FamilyRow[] = response.data.data.rs0.map((item: any, idx: number) => ({
          id: idx + 1,
          FamilyHead: item.FamilyHead?.trim() || "",
          ClientCode: item.ClientCode?.trim() || "",
          ClientName: item.ClientName?.trim() || "",
        }));
        setRows(formattedRows);
      } else setRows([]);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    fetchFamilyMapping();
  }, []);

  // --- Modal Handlers ---
  const openUccModal = () => setIsUccModalOpen(true);
  const closeUccModal = () => setIsUccModalOpen(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setOtpRequired(false);
    setOtp("");
    setLoginMessage("");
    setError("");
    setOtpError("");
  };

  const handleUccNext = () => {
    if (!ucc.trim()) {
      setError("UCC Code is required.");
      return;
    }
    setError("");
    closeUccModal();
    openLoginModal();
  };

  // --- Login API ---
  const handleLogin = async (): Promise<void> => {
    setError("");
    if (!loginData.userId.trim()) return setError("User ID is required.");
    if (!loginData.password.trim()) return setError("Password is required.");

    setIsLoading(true);
    try {
      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"${ACTION_NAME}","Option":"Login"</J_Ui>
        <Sql/>
        <X_Data>
          <UserId>${loginData.userId}</UserId>
          <EPassword>${Encryption(loginData.password)}</EPassword>
          <Product>${PRODUCT}</Product>
          <ICPV></ICPV>
          <Feature></Feature>
        </X_Data>
        <J_Api>"UserId":"", "UserType":"User"</J_Api>
      </dsXml>`;

      const response = await axios.post(BASE_URL + OTP_VERIFICATION_URL, xmlData, {
        headers: { "Content-Type": "application/xml" },
      });

      const data = response.data;
      if (!data?.status) return setError(data?.message || "Invalid credentials.");

      if (data?.token) setTempToken(data.token);

      const loginType = data?.data?.[0]?.LoginType;
      if (loginType === "2FA") {
        setOtpRequired(true);
        setLoginMessage(data?.data?.[0]?.LoginMessage || "");
      } else {
        await saveUccData();
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Verify OTP ---
  const handleOTPVerify = async (): Promise<void> => {
    if (!otp.trim()) return setOtpError("OTP is required.");
    if (!/^\d{4}$/.test(otp)) return setOtpError("OTP must be 4 digits.");

    setIsLoading(true);
    try {
      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"${ACTION_NAME}","Option":"Verify2FA","Level":1,"RequestFrom":"M"</J_Ui>
        <Sql/>
        <X_Data><OTP>${otp}</OTP></X_Data>
        <J_Api>"UserId":"${loginData.userId}", "UserType":"${getLocalStorage("userType")}"</J_Api>
      </dsXml>`;

      await axios.post(BASE_URL + OTP_VERIFICATION_URL, xmlData, {
        headers: {
          "Content-Type": "application/xml",
          Authorization: `Bearer ${tempToken}`,
        },
      });

      await saveUccData();
    } catch {
      setOtpError("OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Save UCC Data ---
  const saveUccData = async (): Promise<void> => {
    try {
      const ipAddress = await getIPAddress();
      const xmlData = `<dsXml>
        <J_Ui>"ActionName":"FamilyMapping","Option":"Add","RequestFrom":"W"</J_Ui>
        <Sql></Sql>
        <X_Data>
          <UccCode>${ucc}</UccCode>
          <IPAddress>${ipAddress}</IPAddress>
        </X_Data>
        <J_Api>"UserId":"${getLocalStorage("userId")}"</J_Api>
      </dsXml>`;

      const response = await axios.post(BASE_URL + OTP_VERIFICATION_URL, xmlData, {
        headers: { "Content-Type": "application/xml" },
      });

      if (response.data?.success) {
        toast.success(response.data.message?.replace(/<[^>]+>/g, "") || "UCC added successfully");
        fetchFamilyMapping();
        setUcc("");
        setOtp("");
        setOtpRequired(false);
        closeLoginModal();
      } else {
        toast.error("Failed to add UCC.");
      }
    } catch {
      toast.error("Failed to save UCC.");
    }
  };

  // --- JSX ---
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Family Mapping</h2>
          <button
            onClick={openUccModal}
            className="py-2 px-4 rounded text-white flex items-center mt-3"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            Add
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No member mapped yet.</p>
        ) : (
          <div className="mt-6">
            <DataGrid columns={columns} rows={rows} />
          </div>
        )}
      </div>

      {/* --- UCC Modal --- */}
      <Modal isOpen={isUccModalOpen} onClose={closeUccModal} isOutsideClickAllowed={false} className="max-w-[400px] p-6">
        <h4 className="text-lg font-semibold mb-4 mt-4">UCC/Code</h4>
        <Input value={ucc} onChange={(e) => setUcc(e.target.value)} placeholder="Enter UCC Code" />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <button className="py-2 px-4 rounded text-black bg-white border-2" onClick={closeUccModal}>Cancel</button>
          <button
            className="py-2 px-4 rounded text-white"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
            onClick={handleUccNext}
          >
            Next
          </button>
        </div>
      </Modal>

      {/* --- Login & OTP Modal --- */}
      <Modal isOpen={isLoginModalOpen} onClose={closeLoginModal} isOutsideClickAllowed={false} className="max-w-[500px] p-6">
        <h4 className="text-lg font-semibold mb-4">{otpRequired ? "Verify OTP" : "Verify User"}</h4>

        {!otpRequired && (
          <>
            <Label>User ID</Label>
            <Input value={loginData.userId} onChange={(e) => setLoginData({ ...loginData, userId: e.target.value })} />
            <Label>Password</Label>
            <Input type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
            {error && <div className="text-red-600">{error}</div>}
          </>
        )}

        {otpRequired && (
          <>
            {loginMessage && <p className="text-sm text-blue-600 mb-2">{loginMessage}</p>}
            <Label>OTP</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 4-digit OTP" />
            {otpError && <div className="text-red-600">{otpError}</div>}
          </>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button className="py-2 px-4 rounded text-black bg-white border-2" onClick={closeLoginModal}>Cancel</button>
          {!otpRequired ? (
            <button
              className="py-2 px-4 rounded text-white"
              style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          ) : (
            <button
              className="py-2 px-4 rounded text-white"
              style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
              onClick={handleOTPVerify}
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

