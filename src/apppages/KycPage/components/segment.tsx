"use client";
import React from 'react';
import { useTheme } from "@/context/ThemeContext";
import { EkycComponentProps } from '@/types/EkycFormTypes';
import { DataGrid } from 'react-data-grid';

const Segment = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();

  // Handler to update the segment tableData
  const handleSegmentUpdate = (id: string, fieldKey: string, value: string) => {
    setFieldData((prevState: any) => {
      // Create a copy of the previous state
      const newState = { ...prevState };

      // Find and update the specific row in segmentTabData
      newState.segmentTabData = {
        ...newState.segmentTabData,
        tableData: newState.segmentTabData.tableData.map((row: any) =>
          row.SegmentValue === id ? { ...row, [fieldKey]: value } : row
        )
      };

      return newState;
    });
  };

  // Dynamically create columns from formFields
  const columns = formFields.map((field) => {
    const baseColumn = {
      key: field.wKey,
      name: field.label,
      sortable: true,
    };

    // Special handling for checkbox fields
    if (field.type === 'WCheckBox') {
      return {
        ...baseColumn,
        renderCell: ({ row }: any) => (
          <input
            type="checkbox"
            checked={row[field.wKey] === "true"}
            onChange={(e) => {
              const newValue = e.target.checked ? "true" : "false";
              handleSegmentUpdate(row.SegmentValue, field.wKey, newValue);
            }}
            className="h-4 w-4"
          />
        )
      };
    }

    return baseColumn;
  });

  // Add unique IDs to rows based on SegmentValue
  const rows = tableData.map((item) => ({
    ...item,
    id: item.SegmentValue // Using SegmentValue as unique identifier
  }));


  const handleSaveAndNext = () => {
    // Perform validation checks here   
    setActiveTab("attachments")
  }

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end mb-2">

        <button
          className="rounded-lg ml-4"
          style={{
            backgroundColor: colors.background,
            padding: "10px"
          }}
          onClick={handleSaveAndNext}
        >
          Save and Next
        </button>
      </div>
      <DataGrid
        columns={columns}
        rows={rows}
        className="rdg-light"
        rowHeight={40}
        headerRowHeight={40}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fonts.content,
        }}
        rowKeyGetter={(row) => row.id}
      />
    </div>
  );
};

export default Segment;