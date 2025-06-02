"use client";
import React from 'react';
import { useTheme } from "@/context/ThemeContext";
import { EkycComponentProps } from '@/types/EkycFormTypes';

const Segment = ({ formFields, tableData, fieldErrors }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">

      <div className="p-4" style={{ fontFamily: fonts.content, color: colors.text }}>
        <h2 className="text-xl font-semibold mb-6">Select Segments</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {tableData.map((segment) => (
            <div key={segment.SegmentValue} className="flex items-center">
              <input
                type="checkbox"
                id={segment.SegmentValue}
                checked={segment.IsSelect === "true"}
                onChange={() => { }}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                disabled // Disabled since we're not implementing the change handler
              />
              <label htmlFor={segment.SegmentValue} className="ml-2 text-sm font-medium">
                {segment.SegmentExch}
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => { }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            style={{ backgroundColor: colors.primary }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Segment;