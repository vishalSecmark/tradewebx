import OTPVerificationForm from "@/components/auth/OTPVerificationForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OTP Verification | TailAdmin",
  description: "Verify your login with OTP",
};

export default function OTPVerification() {
  return <OTPVerificationForm />;
}