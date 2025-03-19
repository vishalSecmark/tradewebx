"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';

export default function OTPVerificationForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const xmlData = `<dsXml>
      <J_Ui>"ActionName":"TradeWeb", "Option":"Verify2FA","Level":1, "RequestFrom":"M"</J_Ui>
      <Sql/>
      <X_Data>
          <OTP>${otp}</OTP>
      </X_Data>
      <X_GFilter/>
      <J_Api>"UserId":"${localStorage.getItem('userId')}"</J_Api>
    </dsXml>`;

    try {
      const response = await axios({
        method: 'post',
        url: 'https://trade-plus.in/TradeWebAPI/api/Main/InitializeLogin',
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${localStorage.getItem('temp_token')}`
        },
        data: xmlData
      });

      const data = response.data;
      
      if (data.status && data.status_code === 200) {
        // Store the final authentication token
        document.cookie = `auth_token=${data.token}; path=/; expires=${new Date(data.tokenExpireTime).toUTCString()}`;
        
        // Update user data in localStorage
        localStorage.setItem('clientCode', data.data[0].ClientCode);
        localStorage.setItem('clientName', data.data[0].ClientName);
        localStorage.setItem('userType', data.data[0].UserType);
        localStorage.setItem('tokenExpireTime', data.tokenExpireTime);

        // Clean up temporary token
        localStorage.removeItem('temp_token');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'An error occurred during OTP verification');
      } else {
        setError('An error occurred during OTP verification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              OTP Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please enter the OTP sent to your registered device
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleOTPVerification}>
            <div className="space-y-4">
              <div>
                <Label>Enter OTP</Label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}