import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes'
import React, { useEffect, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import { useTheme } from "@/context/ThemeContext";
import { fetchEkycDropdownOptions } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';

const KycBank = ({ formFields, tableData, fieldErrors, setFieldData,setActiveTab }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddBank, setOpenAddBank] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<any>({});
  const [bankDropdownOptions, setbankDropdownOptions] = useState<Record<string, any[]>>({});
  const [bankLoadingDropdowns, setbankLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [fieldVlaues, setFieldValues] = useState<Record<string, any>>({});
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, message: '', type: 'M' });

  // Function to create a new empty bank entry
  const createNewBankEntry = () => {
    if (tableData.length > 0) {
      const newEntry: any = {};
      Object.keys(tableData[0]).forEach(key => {
        newEntry[key] = '';
      });
      newEntry.IsDefault = "false";
      return newEntry;
    }
    return {};
  };

  const handleAddBankClick = () => {
    const newBankEntry = createNewBankEntry();
    setCurrentFormData(newBankEntry);
    setOpenAddBank(true);
  };

  // Handler to add new bank entry to the end of tableData
  const handleAddNewBank = () => {
    setFieldData((prevState: any) => {
      const prevTableData = prevState.bankTabData.tableData || [];
      return {
        ...prevState,
        bankTabData: {
          ...prevState.bankTabData,
          tableData: [
            ...prevTableData,
            currentFormData // Add the new entry at the end
          ]
        }
      };
    });
    setOpenAddBank(false);
  };

  // Handler to update the 0th index of bankTabData.tableData in dynamicData
  const handleFieldChange = (updateFn: (prev: any) => any) => {
    setFieldData((prevState: any) => {
      const prevTableData = prevState.bankTabData.tableData || [];
      const updatedRow = updateFn(prevTableData[0] || {});
      return {
        ...prevState,
        bankTabData: {
          ...prevState.bankTabData,
          tableData: [
            updatedRow,
            ...prevTableData.slice(1)
          ]
        }
      };
    });
    setFieldValues((prev: any) => updateFn(prev));
  };

  const handleErrorChange = (updateFn: (prev: any) => any) => {
    setFieldData((prevState: any) => {
      const prevFieldErrors = prevState.bankTabData.fieldErrors || {};
      const updatedErrors = updateFn(prevFieldErrors);
      return {
        ...prevState,
        bankTabData: {
          ...prevState.bankTabData,
          fieldErrors: updatedErrors
        }
      };
    });
  }

  // Transform the tableData to match the expected row structure
  const rows = tableData.map(bank => ({
    mcr: bank.BankMICR,
    ifsc: bank.BankIFSC,
    accountNumber: bank.BankAccNo,
    bankName: bank.BankName,
    accountType: bank.AccountType,
    isDefault: bank.IsDefault === "true"
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
          onChange={(e) => { }}
          className="h-4 w-4"
          disabled
        />
      )
    },
  ];

  useEffect(() => {
    if (formFields && formFields.length > 0) {
      formFields.forEach((field) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setbankDropdownOptions, setbankLoadingDropdowns);
        }
      })
    }
  }, [])

   const handleSaveAndNext = ()     => {
          // Perform validation checks here   
      setActiveTab("demat")
      }

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end">
        <button
          onClick={handleAddBankClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
        >
          Add Bank
        </button>
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
      />
      {openAddBank && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <h4 className="text-xl font-semibold mb-4">Add Bank Details</h4>
            <CaseConfirmationModal
              isOpen={validationModal.isOpen}
              message={validationModal.message}
              type={validationModal.type}
              onConfirm={() => validationModal.callback?.(true)}
              onCancel={() => validationModal.callback?.(false)}
            />
            <EkycEntryForm
              formData={formFields}
              formValues={currentFormData}
              masterValues={{}}
              setFormValues={setCurrentFormData}
              dropdownOptions={bankDropdownOptions}
              loadingDropdowns={bankLoadingDropdowns}
              fieldErrors={fieldErrors}
              setFieldErrors={handleErrorChange}
              setFormData={() => { }}
              setValidationModal={setValidationModal}
              setDropDownOptions={() => { }}
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setOpenAddBank(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewBank}
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