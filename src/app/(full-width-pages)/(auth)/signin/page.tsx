import SignInForm from "@/components/auth/SignInForm";
import Loader from "@/components/Loader";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "TradeWeb",
  description: "TradeWeb",
};

export default function SignIn() {
  return (
    <Suspense fallback={<Loader/>}>
      <SignInForm />
    </Suspense>
  );
}