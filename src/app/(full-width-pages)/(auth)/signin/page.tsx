import SignInForm from "@/components/auth/SignInForm";
import Loader from "@/components/Loader";
import { Suspense } from "react";


export default function SignIn() {
  return (
    <Suspense fallback={<Loader />}>
      <SignInForm />
    </Suspense>
  );
}