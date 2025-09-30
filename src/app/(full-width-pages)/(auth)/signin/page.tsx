import SignInForm from "@/components/auth/SignInForm";
import Loader from "@/components/Loader";
import { Metadata } from "next";
import { Suspense } from "react";


export default function SignIn() {
  return (
    <Suspense fallback={<Loader />}>
      <SignInForm />
    </Suspense>
  );
}