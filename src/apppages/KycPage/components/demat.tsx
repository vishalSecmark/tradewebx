"use client";
import React, { useEffect, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import { useTheme } from "@/context/ThemeContext";
import { EkycComponentProps } from '@/types/EkycFormTypes';
import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { fetchEkycDropdownOptions } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { IoArrowBack } from 'react-icons/io5';

const KycDemat = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddDemat, setOpenAddDemat] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<any>({});
  const [dematDropdownOptions, setDematDropdownOptions] = useState<Record<string, any[]>>({});
  const [dematLoadingDropdowns, setDematLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, message: '', type: 'M' });

  console.log("kyc current form data", currentFormData);

  // Function to create a new empty demat entry
  const createNewDematEntry = () => {
    if (tableData.length > 0) {
      const newEntry: any = {};
      Object.keys(tableData[0]).forEach(key => {
        newEntry[key] = '';
      });
      newEntry.isDefault = "false";
      return newEntry;
    }
    return {};
  };

  const handleAddDematClick = () => {
    const newDematEntry = createNewDematEntry();
    setCurrentFormData(newDematEntry);
    setOpenAddDemat(true);
  };

  // Handler to add new demat entry to the end of tableData
  const handleAddNewDemat = () => {
    setFieldData((prevState: any) => {
      const prevTableData = prevState.dematTabData.tableData || [];
      return {
        ...prevState,
        dematTabData: {
          ...prevState.dematTabData,
          tableData: [
            ...prevTableData,
            currentFormData // Add the new entry at the end
          ]
        }
      };
    });
    setOpenAddDemat(false);
  };

  // Handler to update the 0th index of dematTabData.tableData in dynamicData
  const handleFieldChange = (updateFn: (prev: any) => any) => {
    setFieldData((prevState: any) => {
      const prevTableData = prevState.dematTabData.tableData || [];
      const updatedRow = updateFn(prevTableData[0] || {});
      return {
        ...prevState,
        dematTabData: {
          ...prevState.dematTabData,
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
      const prevFieldErrors = prevState.dematTabData.fieldErrors || {};
      const updatedErrors = updateFn(prevFieldErrors);
      return {
        ...prevState,
        dematTabData: {
          ...prevState.dematTabData,
          fieldErrors: updatedErrors
        }
      };
    });
  };

  // Transform the tableData to match the expected row structure
  const rows = tableData.map(demat => ({
    DematId: demat.DematId,
    DPAcNo: demat.DPAcNo,
    DPID: demat.DPID,
    DematAccountType: demat.DematAccountType,
    isDefault: demat.isDefault === "true"
  }));

  const columns = [
    { key: 'DematId', name: 'Demat Id', sortable: true },
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
          disabled
        />
      )
    },
  ];

  useEffect(() => {
    if (formFields && formFields.length > 0) {
      formFields.forEach((field) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setDematDropdownOptions, setDematLoadingDropdowns);
        }
      });
    }
  }, []);

  const handleSaveAndNext = () => {
    // Perform validation checks here   
    setActiveTab("segment")
  }

  return (
    <div className="w-full p-5 pt-2 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <button
          className="rounded-lg"
          style={{
            backgroundColor: colors.background,
            padding: "10px"
          }} onClick={() => setActiveTab("bank")}
        >
          <IoArrowBack size={20} />
        </button>
        <div className="text-end">
          <button
            onClick={handleAddDematClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
          >
            Add Demat
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
      {openAddDemat && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <h4 className="text-xl font-semibold mb-4">Add Demat Details</h4>
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
              dropdownOptions={dematDropdownOptions}
              onDropdownChange={() => { }}
              loadingDropdowns={dematLoadingDropdowns}
              fieldErrors={fieldErrors}
              setFieldErrors={handleErrorChange}
              setFormData={() => { }}
              setValidationModal={setValidationModal}
              setDropDownOptions={() => { }}
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setOpenAddDemat(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewDemat}
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