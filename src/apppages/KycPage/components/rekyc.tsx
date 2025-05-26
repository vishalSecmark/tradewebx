"use client";
import React, { useState } from 'react';
import { useTheme } from "@/context/ThemeContext";
import { useEkycFormContext } from "@/context/EkycFormContext";

const KycFinalPage = () => {
  const { colors, fonts } = useTheme();
  const { formData, updateFormData } = useEkycFormContext();
  
  const [kycData, setKycData] = useState({
    status: formData.rekyc?.status || '',
    rekyc: formData.rekyc?.rekyc || false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setKycData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = () => {
    updateFormData("rekyc", kycData);
    alert("KYC final details saved successfully!");
    // You can add navigation or other post-submit logic here
  };

  return (
    <div className="p-4" style={{ fontFamily: fonts.content, color: colors.text }}>
      <h2 className="text-xl font-semibold mb-6">Final KYC Details</h2>
      
      <div className="max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <input
            type="text"
            name="status"
            value={kycData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter KYC status"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="rekyc"
            id="rekyc"
            checked={kycData.rekyc}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="rekyc" className="ml-2 text-sm font-medium">
            ReKYC Required
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            style={{ backgroundColor: colors.primary }}
          >
            Submit KYC
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycFinalPage;