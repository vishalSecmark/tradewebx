"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAuthData, setError as setAuthError, setLoading } from '@/redux/features/authSlice';
import { BASE_URL } from "@/utils/constants";

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setAuthError(null));

    const params = {
      userId: userId,
      password: password,
      key: 'PKQMK2-ZDQS6F-/4UKSQ-QBB3',
      loginAs: 'M~2.0.0.1',
      product: 'T'
    };

    try {
      const response = await axios({
        method: 'post',
        url: BASE_URL + '/TradeWebAPI/api/Main/Login_validate_Password',
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
        data: ''  // Empty body as requested
      });

      const data = response.data;
      console.log(data);

      if (data.status) {
        dispatch(setAuthData({
          userId: userId,
          token: data.token,
          tokenExpireTime: data.tokenExpireTime,
          clientCode: data.data[0].ClientCode,
          clientName: data.data[0].ClientName,
          userType: data.data[0].UserType,
          loginType: data.data[0].LoginType,
        }));

        localStorage.setItem('userId', userId);
        localStorage.setItem('temp_token', data.token);
        localStorage.setItem('tokenExpireTime', data.tokenExpireTime);
        localStorage.setItem('clientCode', data.data[0].ClientCode);
        localStorage.setItem('clientName', data.data[0].ClientName);
        localStorage.setItem('userType', data.data[0].UserType);
        localStorage.setItem('loginType', data.data[0].LoginType);

        router.push('/otp-verification');
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
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Sign In
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your username"
                  {...{} as any}
                />
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    {...{} as any}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
