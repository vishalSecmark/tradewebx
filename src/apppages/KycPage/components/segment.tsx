"use client";
import React, { useState } from 'react';
import { useTheme } from "@/context/ThemeContext";
import { useEkycFormContext } from "@/context/EkycFormContext";

const segmentOptions = [
  { id: 'bse_cash', label: 'BSE/Cash' },
  { id: 'bse_comm', label: 'BSE/Comm' },
  { id: 'bse_fno', label: 'BSE/F&O' },
  { id: 'bse_fx', label: 'BSE/FX' },
  { id: 'bse_mf', label: 'BSE/MF' },
  { id: 'mx_cash', label: 'MX/Cash' },
  { id: 'mx_comm', label: 'MX/Comm' },
  { id: 'mx_fno', label: 'MX/F&O' },
  { id: 'mx_fx', label: 'MX/FX' },
  { id: 'nse_cash', label: 'NSE/Cash' },
  { id: 'nse_fno', label: 'NSE/F&O' },
  { id: 'nse_fx', label: 'NSE/FX' },
  { id: 'nse_mf', label: 'NSE/MF' },
];

const Segment = () => {
  const { colors, fonts } = useTheme();
  const { formData, updateFormData } = useEkycFormContext();
  
  // Initialize state with existing segment data or empty object
  const [selectedSegments, setSelectedSegments] = useState<Record<string, boolean>>(
    formData.segments || segmentOptions.reduce((acc, option) => {
      acc[option.id] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleCheckboxChange = (id: string) => {
    setSelectedSegments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSave = () => {
    updateFormData("segments", selectedSegments);
    // Optional: Show success message or navigate
    alert("Segments saved successfully!");
  };

  return (
    <div className="p-4" style={{ fontFamily: fonts.content, color: colors.text }}>
      <h2 className="text-xl font-semibold mb-6">Select Segments</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {segmentOptions.map((option) => (
          <div key={option.id} className="flex items-center">
            <input
              type="checkbox"
              id={option.id}
              checked={selectedSegments[option.id] || false}
              onChange={() => handleCheckboxChange(option.id)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={option.id} className="ml-2 text-sm font-medium">
              {option.label}
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          style={{ backgroundColor: colors.primary }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Segment;