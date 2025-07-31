"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { useTheme } from "../../context/ThemeContext";
import { useSearchParams } from "next/navigation";

import Image from "next/image";
import axios from "axios";
import { ACTION_NAME, BASE_URL, PATH_URL } from "../../utils/constants";
import apiService from "@/utils/apiService";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { colors } = useTheme();
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    setIsLoading(true);

    // Get userid from URL parameters, fallback to localStorage
    const urlUserId = searchParams.get('userid');
    const userData = {
      userId: localStorage.getItem('userId') || ''
    };

    const xmlData = `<dsXml>
        <J_Ui>"ActionName":"${ACTION_NAME}", "Option":"UserProfile","Level":1, "RequestFrom":"M"</J_Ui>
        <Sql></Sql>
        <X_Filter></X_Filter>
        <X_Filter_Multiple>${urlUserId ? `<ClientCode>${urlUserId}</ClientCode>` : ''}</X_Filter_Multiple>
        <X_GFilter></X_GFilter>
        <J_Api>"UserId":"${userData.userId}", "UserType":"${localStorage.getItem('userType')}"</J_Api>
    </dsXml>`;

    try {
      const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);

      if (response.data?.data?.rs0?.[0]) {
        setProfileData(response.data.data.rs0[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoading(false);
    }
  };

  // Helper function to get personal details
  const getPersonalDetail = (field) => {
    return profileData?.["Personal Detail"]?.[0]?.[field] || "";
  };

  // Helper function to get address details
  const getAddressDetail = (field) => {
    return profileData?.["Address Details"]?.[0]?.[field] || "";
  };

  // Helper function to get bank details
  const getBankDetail = (field) => {
    return profileData?.["Bank Details"]?.[0]?.[field] || "";
  };

  // Helper function to get demat details
  const getDematDetail = (field) => {
    return profileData?.["Demat Details"]?.[0]?.[field] || "";
  };

  // Helper function to get user initials
  const getUserInitials = () => {
    const name = getPersonalDetail("Name");
    if (!name) return "";

    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    return "";
  };

  // Helper function to get data from any section
  const getSectionData = (sectionName, field) => {
    return profileData?.[sectionName]?.[0]?.[field] || "";
  };

  // Configuration for different sections and their fields
  const sectionConfigs = {
    "Personal Detail": {
      title: "Personal Details",
      fields: [
        { key: "Code", label: "Code" },
        { key: "Name", label: "Name" },
        { key: "Mobile", label: "Mobile" },
        { key: "Email", label: "Email" },
        { key: "Gender", label: "Gender" },
        { key: "PAN", label: "PAN" },
        { key: "LastLogin", label: "Last Login" }
      ]
    },
    "Address Details": {
      title: "Address Details",
      fields: [
        { key: "Address", label: "Address", isAddress: true },
        { key: "City", label: "City" },
        { key: "State", label: "State" },
        { key: "Country", label: "Country" },
        { key: "PIN", label: "PIN" },
        { key: "Designation", label: "Designation" }
      ]
    },
    "Bank Details": {
      title: "Bank Details",
      fields: [
        { key: "Name", label: "Bank Name" },
        { key: "Account No", label: "Account No" },
        { key: "IFSC", label: "IFSC" },
        { key: "MICR", label: "MICR" },
        { key: "AccountType", label: "Account Type" }
      ]
    },
    "Demat Details": {
      title: "Demat Details",
      fields: [
        { key: "DP ID", label: "DP ID" },
        { key: "DP Account No", label: "DP Account No" }
      ]
    }
  };

  // Function to render a single section box
  const renderSectionBox = (sectionName, sectionData) => {
    const config = sectionConfigs[sectionName];
    if (!config) return null;

    return (
      <div key={sectionName} className="p-5 border rounded-2xl lg:p-6" style={cardStyle}>
        <h4 className="mb-4 text-lg font-semibold" style={textStyle}>{config.title}</h4>
        <div className="space-y-3">
          {config.fields.map((field) => {
            let value = getSectionData(sectionName, field.key);

            // Special handling for address field
            if (field.isAddress) {
              const address1 = getSectionData(sectionName, "Address1");
              const address2 = getSectionData(sectionName, "Address2");
              const address3 = getSectionData(sectionName, "Address3");
              value = [address1, address2, address3].filter(Boolean).join(", ");
            }

            return (
              <div key={field.key} className="flex justify-between">
                <span className="text-sm" style={secondaryTextStyle}>{field.label}</span>
                <span className={`text-sm font-medium ${field.isAddress ? 'text-right' : ''}`} style={textStyle}>
                  {value || '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get available sections from profileData
  const getAvailableSections = () => {
    if (!profileData) return [];

    return Object.keys(profileData).filter(sectionName =>
      sectionConfigs[sectionName] &&
      profileData[sectionName] &&
      Array.isArray(profileData[sectionName]) &&
      profileData[sectionName].length > 0
    );
  };

  const handleSave = () => {
    // Handle save logic here
    closeModal();
  };

  // Custom styles based on theme
  const cardStyle = {
    backgroundColor: colors.cardBackground,
    borderColor: colors.color3,
  };

  const textStyle = {
    color: colors.text,
  };

  const secondaryTextStyle = {
    color: colors.secondary,
  };

  const socialButtonStyle = {
    backgroundColor: colors.buttonBackground,
    borderColor: colors.color3,
  };

  const socialIconStyle = {
    color: colors.buttonText,
  };

  return (
    <>
      <div className="p-5 border rounded-2xl lg:p-6" style={cardStyle}>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p style={textStyle}>Loading profile data...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border rounded-full flex items-center justify-center" style={{ borderColor: colors.color3, backgroundColor: colors.buttonBackground }}>
                {profileData ? (
                  <span className="text-xl font-bold" style={{ color: colors.buttonText }}>
                    {getUserInitials()}
                  </span>
                ) : (
                  <Image
                    width={80}
                    height={80}
                    src="/images/user/owner.jpg"
                    alt="user"
                  />
                )}
              </div>
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-lg font-semibold text-center xl:text-left" style={textStyle}>
                  {getPersonalDetail("Name")}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-sm" style={secondaryTextStyle}>
                    {getPersonalDetail("Code")}
                  </p>
                  <div className="hidden h-3.5 w-px xl:block" style={{ backgroundColor: colors.color3 }}></div>
                  <p className="text-sm" style={secondaryTextStyle}>
                    {getAddressDetail("City")}, {getAddressDetail("Country")}
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Add profile details sections */}
      {!isLoading && profileData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {getAvailableSections().map(sectionName => renderSectionBox(sectionName, profileData))}
        </div>
      )}
    </>
  );
}
