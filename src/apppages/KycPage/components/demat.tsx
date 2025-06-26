"use client";
import React, { useEffect, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import { useTheme } from "@/context/ThemeContext";
import { EkycComponentProps } from '@/types/EkycFormTypes';
import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { fetchEkycDropdownOptions, handleSaveSinglePageData } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { IoArrowBack } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { useSaveLoading } from '@/context/SaveLoadingContext';

const KycDemat = ({ formFields, tableData, setFieldData, setActiveTab, Settings }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const { setSaving } = useSaveLoading();
  
  const [localFormData, setLocalFormData] = useState<any>(formFields ||  {});
  const [openAddDemat, setOpenAddDemat] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<any>({});
  const [dematDropdownOptions, setDematDropdownOptions] = useState<Record<string, any[]>>({});
  const [dematLoadingDropdowns, setDematLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, message: '', type: 'M' });

  // Generate dynamic columns based on formFields
  const generateDynamicColumns = () => {
    return formFields
      .filter(field => field.isVisibleinTable !== "false") // Only include fields marked as visible
      .map(field => {
        // Special handling for checkbox fields
        if (field.type === 'WCheckBox') {
          return {
            key: field.wKey,
            name: field.label,
            renderCell: ({ row }: any) => (
              <input
                type="checkbox"
                checked={row[field.wKey] === "true"}
                readOnly
                className="h-4 w-4"
              />
            )
          };
        }
        
        // Default column configuration for other field types
        return {
          key: field.wKey,
          name: field.label,
          sortable: false
        };
      });
  };

  // Function to create a new empty demat entry
  const createNewDematEntry = () => {
    const newEntry: Record<string, any> = {};

    // Add all fields from formFields with empty values
    formFields.forEach((field: any) => {
      if (field.wKey) {
        // Set default empty value based on field type
        switch(field.type) {
          case 'WCheckBox':
            newEntry[field.wKey] = "false";
            break;
          case 'WDropDownBox':
            newEntry[field.wKey] = ""; // Dropdowns typically start empty
            break;
          default:
            newEntry[field.wKey] = "";
        }
      }
    });

    // Add system fields
    newEntry.IsDefault = "false";
    newEntry.IsInserted = "true";
    
    return newEntry;
  };

  const handleAddDematClick = () => {
    const maxAllowed = Number(Settings?.maxAllowedRecords) || 0;
    if (maxAllowed > 0 && tableData.length >= maxAllowed) {
      toast.error(`You can only add up to ${maxAllowed} demat accounts.`);
      return;
    }
    
    const newDematEntry = createNewDematEntry();
    setCurrentFormData(newDematEntry);
    setOpenAddDemat(true);
    // Clear errors when adding new demat
    setFieldErrors({});
  };

  // Validate mandatory fields
  const validateMandatoryFields = (formData: any) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    formFields.forEach((field) => {
      if (field.isMandatory === "true" && !formData[field.wKey]) {
        errors[field.wKey] = `${field.label} is required`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  // Handler to add new demat entry
  const handleSaveDemat = () => {
    const { isValid, errors } = validateMandatoryFields(currentFormData);
    setFieldErrors(errors);

    if (!isValid) {
      return;
    }

    // If this is being set as default, unset all other defaults
    const updatedDematData = currentFormData.IsDefault === "true"
      ? { ...currentFormData }
      : currentFormData;

    setFieldData((prevState: any) => {
      const prevTableData = prevState.dematTabData.tableData || [];
      
      // If setting as default, unset all other defaults
      const updatedTableData = updatedDematData.IsDefault === "true"
        ? prevTableData.map(demat => ({ ...demat, IsDefault: "false" }))
        : prevTableData;

      return {
        ...prevState,
        dematTabData: {
          ...prevState.dematTabData,
          tableData: [
            ...updatedTableData,
            updatedDematData
          ]
        }
      };
    });

    clearFormAndCloseModal();
  };

  // Function to clear form and close modal
  const clearFormAndCloseModal = () => {
    setCurrentFormData({});
    setFieldErrors({});
    setOpenAddDemat(false);
  };

  const handleSaveAndNext = () => {
    const transformedData = tableData.map((item: any) => ({
      ...item,
      ...(item?.DematId && { IsInserted: "false" })
    }));
    handleSaveSinglePageData(Settings.SaveNextAPI, transformedData, setActiveTab, "segment", setSaving);
  };

  useEffect(() => {
    if (formFields && formFields.length > 0) {
      formFields.forEach((field) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setDematDropdownOptions, setDematLoadingDropdowns);
        }
      });
    }
  }, [formFields]);

  useEffect(() => {
    const newEntry = createNewDematEntry();
    if (Object.keys(currentFormData).length === 0) {
      setCurrentFormData(newEntry);
    }
  }, []);

  return (
    <div className="w-full p-5 pt-2 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <button
          className="rounded-lg px-4 py-1"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.buttonBackground}`,
          }} 
          onClick={() => setActiveTab("bank")}
        >
          <IoArrowBack size={20} />
        </button>
        <div className="text-end">
          <button
            onClick={handleAddDematClick}
            className="px-4 py-1 rounded"
            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
          >
            Add Demat
          </button>
          <button
            className="rounded-lg ml-4 px-4 py-1"
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.buttonBackground}`,
            }}
            onClick={handleSaveAndNext}
          >
            Save and Next
          </button>
        </div>
      </div>
      <DataGrid
        columns={generateDynamicColumns()}
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

      {openAddDemat && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center gap-4 mt-2 mb-4">
              <h4 className="text-xl font-semibold">Add Demat Details</h4>
              <div className="flex gap-4">
                <button
                  onClick={clearFormAndCloseModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDemat}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>

            <CaseConfirmationModal
              isOpen={validationModal.isOpen}
              message={validationModal.message}
              type={validationModal.type}
              onConfirm={() => validationModal.callback?.(true)}
              onCancel={() => validationModal.callback?.(false)}
            />

            <EkycEntryForm
              formData={localFormData}
              formValues={currentFormData}
              masterValues={{}}
              setFormValues={setCurrentFormData}
              onDropdownChange={() => { }}
              dropdownOptions={dematDropdownOptions}
              loadingDropdowns={dematLoadingDropdowns}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              setFormData={setLocalFormData}
              setValidationModal={setValidationModal}
              setDropDownOptions={() => { }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KycDemat;