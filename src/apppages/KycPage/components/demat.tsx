"use client";
import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';

import { useTheme } from "@/context/ThemeContext";
import { EkycComponentProps } from '@/types/EkycFormTypes';
import EkycEntryForm from '@/components/component-forms/EkycEntryForm';

const KycDemat = ({ formFields, tableData, fieldErrors }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddDemat, setOpenAddDemat] = useState(false);

  const columns = [
    { key: 'DematId', name: 'Dema rId', sortable: true },
    { key: 'DPAcNo', name: 'DP Acc No', sortable: true },
    { key: 'DPID', name: 'Demat Number', sortable: true },
    { key: 'DematAccountType', name: 'Acc Type', sortable: true },
    {
      key: 'isDefault',
      name: 'Default Account',
      renderCell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.isDefault}
          onChange={(e) => { }}
          className="h-4 w-4"
          disabled // Disabled since we're not implementing the change handler
        />
      )
    },
  ];


  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end mb-3">
        <button
          onClick={() => setOpenAddDemat(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Demat
        </button>


      </div>
      <DataGrid
        columns={columns}
        rows={tableData || []}
        className="rdg-light"
        rowHeight={40}
        headerRowHeight={40}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fonts.content,
        }}
      />


      {/* Add Demat Modal */}
      {openAddDemat && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-xl font-semibold mb-4">Add Demat Account</h4>

            <EkycEntryForm
              formData={formFields}
              formValues={tableData[0] || {}}
              masterValues={{}}
              setFormValues={() => { }}
              dropdownOptions={{}}
              loadingDropdowns={{}}
              fieldErrors={fieldErrors}
              setFieldErrors={() => { }}
              setFormData={() => { }}
              setValidationModal={() => { }}
              setDropDownOptions={() => { }}
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setOpenAddDemat(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycDemat;