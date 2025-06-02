import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes'
import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';

import { useTheme } from "@/context/ThemeContext";

const KycBank = ({ formFields, tableData, fieldErrors }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddBank, setOpenAddBank] = useState(false);

  // Transform the tableData to match the expected row structure
  const rows = tableData.map(bank => ({
    mcr: bank.BankMICR,
    ifsc: bank.BankIFSC,
    accountNumber: bank.BankAccNo,
    bankName: bank.BankName,
    accountType: bank.AccountType,
    isDefault: bank.IsDefault === "true" // Convert string to boolean
  }));

  const columns = [
    { key: 'mcr', name: 'MCR', sortable: true },
    { key: 'ifsc', name: 'IFSC Code', sortable: true },
    { key: 'accountNumber', name: 'Account Number', sortable: true },
    { key: 'bankName', name: 'Bank Name', sortable: true },
    { key: 'accountType', name: 'Account Type', sortable: true },
    {
      key: 'isDefault',
      name: 'Default Account',
      renderCell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.isDefault}
          onChange={(e) => {}}
          className="h-4 w-4"
          disabled // Disabled since we're not implementing the change handler
        />
      )
    },
  ];

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end">
        <button 
          onClick={() => setOpenAddBank(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
        >
          Add Bank
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
      />
      {openAddBank && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-xl font-semibold mb-4">Add Bank Details</h4>

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
                  setOpenAddBank(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => { }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KycBank;