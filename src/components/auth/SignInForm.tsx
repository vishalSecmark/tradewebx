"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthData, setError as setAuthError, setLoading } from '@/redux/features/authSlice';
import { BASE_URL, LOGIN_AS, PRODUCT, LOGIN_KEY, LOGIN_URL, BASE_PATH_FRONT_END, OTP_VERIFICATION_URL, VERSION, ACTION_NAME } from "@/utils/constants";
import Image from "next/image";
import { RootState } from "@/redux/store";
import { clearAuthStorage } from '@/utils/auth';
import Link from "next/link";
import CryptoJS from 'crypto-js';

// Password encryption key
const passKey = "TradeWebX1234567";

// Encryption function
function Encryption(data: string) {
  const key = CryptoJS.enc.Utf8.parse(passKey);
  const iv = CryptoJS.enc.Utf8.parse(passKey);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), key,
    {
      keySize: 128 / 8,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
  return encrypted.toString();
}

// Interface for version updates
interface VersionItem {
  Name: string;
  Status: string;
  Message: string;
  Remark?: string;
}

// Component for the version update modal
const VersionUpdateModal = ({
  isOpen,
  onClose,
  updates,
  onConfirm,
  userType = "User", // Add userType prop to determine if user can update
  isUpdating = false // Add loading state prop
}: {
  isOpen: boolean;
  onClose: () => void;
  updates: VersionItem[];
  onConfirm: () => void;
  userType?: string;
  isUpdating?: boolean;
}) => {
  if (!isOpen) return null;

  // Check if there are any mandatory updates
  const hasMandatoryUpdates = updates.some(update => update.Status === 'M');

  // Determine if user has update rights based on UserType from login response
  // "user" = normal user (cannot update), anything else = admin (can update)
  const canUpdate = userType.toLowerCase() !== "user";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[300]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-[500px]" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <h4 className="text-xl font-semibold mb-4 dark:text-white">
          {hasMandatoryUpdates ? 'Mandatory Update Required' : 'Update Available'}
        </h4>

        {/* Show different messages based on update type and user rights */}
        {hasMandatoryUpdates && !canUpdate && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Access Restricted:</strong>
                <p className="mt-1">You cannot login as User until the mandatory system update is completed. Please contact your administrator to update the system.</p>
              </div>
            </div>
          </div>
        )}

        {hasMandatoryUpdates && canUpdate && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Important:</strong>
                <p className="mt-1">This update is mandatory and must be installed before you can access the system.</p>
              </div>
            </div>
          </div>
        )}

        {!hasMandatoryUpdates && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
            <strong>Optional Update Available:</strong> You can choose to install now or continue and update later.
          </div>
        )}

        <div className="mb-6">
          {updates.map((update, index) => (
            <div key={index} className="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="font-medium text-gray-800 dark:text-white">{update.Name}</div>
              <div className="text-gray-600 dark:text-gray-300">{update.Message}</div>
              {update?.Remark && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-2 rounded">
                  <span className="font-medium">Remarks:</span> {update.Remark}
                </div>
              )}
              <div className="text-sm mt-1">
                <span className={`px-2 py-0.5 rounded-full ${update.Status === 'M' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                  {update.Status === 'M' ? 'Mandatory' : 'Optional'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          {/* For users with mandatory updates: Only OK button that closes modal and prevents login */}
          {hasMandatoryUpdates && !canUpdate ? (
            <button
              onClick={onClose}
              disabled={isUpdating}
              className={`px-6 py-2 rounded-md font-medium ${isUpdating
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
                } text-white`}
            >
              OK
            </button>
          ) : (
            <>
              {/* For optional updates or admin users: Show skip/cancel option */}
              {!hasMandatoryUpdates && (
                <button
                  onClick={onClose}
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-md ${isUpdating
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                >
                  {userType.toLowerCase() === "user" ? "OK" : "Skip for Now"}
                </button>
              )}

              {/* Update button - only for users who can update */}
              {canUpdate && (
                <button
                  onClick={onConfirm}
                  disabled={isUpdating}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${isUpdating
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                >
                  {isUpdating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  ) : (
                    hasMandatoryUpdates ? 'Update Now' : 'Update'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { companyInfo, status } = useSelector((state: RootState) => state.common);

  // State for version update modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionUpdates, setVersionUpdates] = useState<VersionItem[]>([]);
  const [version, setVersion] = useState("2.0.0.0"); // Default version
  const [loginData, setLoginData] = useState<any>(null); // Store login data for navigation after version check
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for update button
  const [currentUserType, setCurrentUserType] = useState<string>(""); // Store user type from login response

  // Check version function inside component using useCallback to memoize
  const checkVersion = useCallback(async () => {
    try {
      const xmlData = `
        <dsXml>
          <J_Ui>"ActionName":"${ACTION_NAME}","Option":"CheckVersion","RequestFrom":"W","ReportDisplay":"A"</J_Ui>
          <Sql/>
          <X_Filter>
              <ApplicationName>${ACTION_NAME}</ApplicationName>
              <Product>${PRODUCT}</Product>
              <Version>${VERSION}</Version>
          </X_Filter>
          <J_Api>"UserId":"", "UserType":"User"</J_Api>
        </dsXml>
      `;

      const response = await axios({
        method: 'post',
        url: BASE_URL + OTP_VERIFICATION_URL,
        data: xmlData,
        headers: {
          'Content-Type': 'application/xml',
        }
      });

      console.log('Version check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Version check error:', error);
      throw error;
    }
  }, [version]);

  // Function to proceed with navigation after version check
  const proceedAfterVersionCheck = useCallback((dataToUse?: any, forceLogout = false) => {
    const currentLoginData = dataToUse || loginData;
    if (!currentLoginData) return;

    // If forceLogout is true (mandatory update for non-admin users), clear everything and stay on login
    if (forceLogout) {

      // function Clear all auth data
      clearAuthStorage();

      // Reset form
      setUserId("");
      setPassword("");
      setError("System update required. Please contact your administrator to update the system.");
      dispatch(setAuthError("System update required. Please contact your administrator to update the system."));
      return;
    }

    if (currentLoginData.LoginType === "2FA") {
      router.push('/otp-verification');
    } else {
      // Set localStorage only
      localStorage.setItem('auth_token', currentLoginData.token);
      localStorage.setItem('refreshToken', currentLoginData.refreshToken);
      localStorage.setItem('tokenExpireTime', currentLoginData.tokenExpireTime);
      localStorage.removeItem('temp_token');
      router.push('/dashboard');
    }
  }, [loginData, router, dispatch]);

  // Function to perform version check after successful login
  const performVersionCheckAfterLogin = useCallback(async (currentLoginData: any) => {
    try {
      const result = await checkVersion();

      // Check if the API returned success: false
      if (result.success === false) {
        // Show error message and don't let user proceed
        const errorMessage = result.message || 'Version check failed. Please try again.';
        setError(errorMessage);
        dispatch(setAuthError(errorMessage));

        // Clear login data and reset form
        clearAuthStorage();

        // Reset form state
        setUserId("");
        setPassword("");
        setLoginData(null);
        return; // Don't proceed to next page
      }

      if (result.success && result.data?.rs0?.length > 0) {
        setVersionUpdates(result.data.rs0);
        setShowVersionModal(true);
      } else {
        // No updates available, proceed with navigation
        proceedAfterVersionCheck(currentLoginData);
      }
    } catch (error) {
      console.error('Failed to check version:', error);
      // Show error message and don't let user proceed in case of network/other errors
      const errorMessage = 'Failed to check version. Please check your connection and try again.';
      setError(errorMessage);
      dispatch(setAuthError(errorMessage));

      // Clear login data and reset form
      clearAuthStorage();

      // Reset form state
      setUserId("");
      setPassword("");
      setLoginData(null);
    }
  }, [checkVersion, proceedAfterVersionCheck, dispatch]);

  // Handle the update confirmation
  const handleUpdateConfirm = useCallback(async () => {
    setIsUpdating(true); // Start loading
    setError(""); // Clear any previous errors

    try {
      const xmlData = `
        <dsXml>
          <J_Ui>"ActionName":"${ACTION_NAME}","Option":"UpdateVersion","RequestFrom":"W","ReportDisplay":"A"</J_Ui>
          <Sql/>
          <X_Filter>
              <ApplicationName>TradeWeb</ApplicationName>
              <Product>${PRODUCT}</Product>
              <Version>${VERSION}</Version>
          </X_Filter>
          <J_Api>"UserId":"", "UserType":"User"</J_Api>
        </dsXml>
      `;

      const response = await axios({
        method: 'post',
        url: BASE_URL + OTP_VERIFICATION_URL,
        data: xmlData,
        headers: {
          'Content-Type': 'application/xml',
        }
      });

      console.log('Version update response:', response.data);

      // Check if update was successful
      if (response.data.success) {
        setShowVersionModal(false);
        setIsUpdating(false);
        // Only proceed with login after successful update
        proceedAfterVersionCheck(loginData);
      } else {
        // Update failed, show error but keep modal open for mandatory updates
        const hasMandatoryUpdates = versionUpdates.some(update => update.Status === 'M');
        setIsUpdating(false);
        if (hasMandatoryUpdates) {
          setError("Update failed. Please try again or contact support.");
        } else {
          // For optional updates, allow proceeding even if update fails
          setShowVersionModal(false);
          proceedAfterVersionCheck(loginData);
        }
      }
    } catch (error) {
      console.error('Failed to update version:', error);

      // Check if it's a mandatory update
      const hasMandatoryUpdates = versionUpdates.some(update => update.Status === 'M');
      setIsUpdating(false);

      if (hasMandatoryUpdates) {
        // For mandatory updates, don't proceed if update fails
        setError("Update failed. Please check your connection and try again.");
      } else {
        // For optional updates, allow proceeding even if update fails
        setShowVersionModal(false);
        proceedAfterVersionCheck(loginData);
      }
    }
  }, [version, loginData, proceedAfterVersionCheck, versionUpdates]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    dispatch(setLoading(true));
    dispatch(setAuthError(null));

    const xmlData = `<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"Login"</J_Ui>
    <Sql/>
    <X_Filter></X_Filter>
    <X_Data>
        <UserId>${userId}</UserId>
        
        <EPassword>${Encryption(password)}</EPassword>
        <Key></Key>
        
        <Product>${PRODUCT}</Product>
        <ICPV></ICPV>
        <Feature></Feature>
    </X_Data>
    <J_Api>"UserId":"", "UserType":"User"</J_Api>
</dsXml>`;

    console.log('Login XML Data:', xmlData);

    try {
      const response = await axios({
        method: 'post',
        url: BASE_URL + OTP_VERIFICATION_URL,
        data: xmlData,
        headers: {
          'Content-Type': 'application/xml',
        }
      });

      const data = response.data;
      console.log('Login Response:', data);

      if (data.status) {
        // Store the UserType from login response
        const userType = data.data[0].UserType;
        setCurrentUserType(userType);

        dispatch(setAuthData({
          userId: userId,
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpireTime: data.tokenExpireTime,
          clientCode: data.data[0].ClientCode,
          clientName: data.data[0].ClientName,
          userType: userType,
          loginType: data.data[0].LoginType,
        }));

        localStorage.setItem('userId', userId);
        localStorage.setItem('temp_token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('tokenExpireTime', data.tokenExpireTime);
        localStorage.setItem('clientCode', data.data[0].ClientCode);
        localStorage.setItem('clientName', data.data[0].ClientName);
        localStorage.setItem('userType', userType);
        localStorage.setItem('loginType', data.data[0].LoginType);
        localStorage.removeItem("ekyc_dynamicData");
        localStorage.removeItem("ekyc_activeTab");

        // Store login data for navigation after version check
        const currentLoginData = {
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpireTime: data.tokenExpireTime,
          LoginType: data.data[0].LoginType
        };

        setLoginData(currentLoginData);

        // Check for version updates after successful login
        await performVersionCheckAfterLogin(currentLoginData);
      } else {
        dispatch(setAuthError(data.message || 'Login failed'));
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.log(err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || 'An error occurred during login'
        : 'An error occurred during login';

      dispatch(setAuthError(errorMessage));
      setError(errorMessage);
    } finally {
      dispatch(setLoading(false));
      setIsLoading(false);
    }
  };

  // Effect to clear local storage and redirect to sign-in if clearLocalStorage param is true
  useEffect(() => {
    if (searchParams.get('clearLocalStorage') === 'true') {
      localStorage.clear();
      router.replace(`${BASE_PATH_FRONT_END}/signin`);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto ">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div>
            {companyInfo?.CompanyLogo && (
              <div className="flex justify-center mb-5">
                <Image
                  src={companyInfo.CompanyLogo.startsWith('data:')
                    ? companyInfo.CompanyLogo
                    : `data:image/png;base64,${companyInfo.CompanyLogo}`}
                  alt="Company Logo"
                  width={64}
                  height={64}
                  className="h-20 w-auto object-contain drop-shadow-md"
                  priority
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-black dark:text-white text-center mb-2">
              {companyInfo?.CompanyName?.trim() || ""}
            </h1>
          </div>

          <div className="my-5 border-b border-gray-200 dark:border-gray-700"></div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Welcome Back
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Sign in to continue to your account</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-gray-700 dark:text-gray-300 font-medium">Username</Label>
              <Input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your username"
                className="mt-1 transition-all duration-200 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900"
                {...{} as any}
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="transition-all duration-200 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900"
                  {...{} as any}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all duration-200 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign in'}
            </Button>
          </form>
          <div className="flex justify-center items-center mt-2">
            <Link href="/forgot-password">Forgot Password?</Link>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Version {VERSION}
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>Powered By:</span>
          <a href="https://www.secmark.in" target="_blank" rel="noopener noreferrer" className="transition hover:opacity-80">
            <Image src={BASE_PATH_FRONT_END + "/images/secmarklogo.png"} alt="Tradesoft" width={90} height={90} />
          </a>
        </div>
      </div>

      {/* Version Update Modal */}
      <VersionUpdateModal
        isOpen={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setIsUpdating(false); // Reset loading state when modal closes

          // Check if there are mandatory updates and user doesn't have update rights
          const hasMandatoryUpdates = versionUpdates.some(update => update.Status === 'M');
          // Use UserType from login response to determine user permissions
          // "user" = normal user (cannot update), anything else = admin (can update)
          const canUpdate = currentUserType.toLowerCase() !== "user";

          if (hasMandatoryUpdates && !canUpdate) {
            // Force logout for users with mandatory updates who cannot update
            proceedAfterVersionCheck(loginData, true);
          } else {
            // Allow normal login flow for optional updates or admin users
            proceedAfterVersionCheck(loginData);
          }
        }}
        updates={versionUpdates}
        onConfirm={handleUpdateConfirm}
        userType={currentUserType}
        isUpdating={isUpdating}
      />
    </div>
  );
}
