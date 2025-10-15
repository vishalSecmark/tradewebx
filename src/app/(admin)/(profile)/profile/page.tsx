"use client";
import Loader from "@/components/Loader";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { useTheme } from "@/context/ThemeContext";
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import Button from "@/components/ui/button/Button";


export default function Profile() {
  const { colors } = useTheme();
  const router = useRouter();

  const containerStyle = {
    backgroundColor: colors.background2,
    borderColor: colors.color3,
  };

  const headingStyle = {
    color: colors.text,
  };

  const handleBack = () => {
    router.back(); 
  };

  return (
    <div className="h-screen">
      <div className="rounded-2xl border p-5 lg:p-6" style={containerStyle}>
        <div className="flex items-center justify-between mb-5 lg:mb-7">
          <h3 className="text-lg font-semibold" style={headingStyle}>
            Profile
          </h3>
          <Button
            onClick={handleBack}
            className={`flex items-center text-white rounded-md`}                                          
          >
            <MdArrowBack/> Back
          </Button>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<Loader />}>
            <UserMetaCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}