import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import { useTheme } from "@/context/ThemeContext";
import { fetchEkycDropdownOptions } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';

const Nominee = ({ formFields, tableData, fieldErrors, setFieldData }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddNominee, setOpenAddNominee] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<any>({});
  const [nomineeDropdownOptions, setNomineeDropdownOptions] = useState<Record<string, any[]>>({});
  const [nomineeLoadingDropdowns, setNomineeLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, message: '', type: 'M' });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Function to create a new empty nominee entry
  const createNewNomineeEntry = () => {
    if (tableData.length > 0) {
      const newEntry: any = {};
      Object.keys(tableData[0]).forEach(key => {
        newEntry[key] = '';
      });
      newEntry.IsNomineeDeleted = "false";
      return newEntry;
    }
    return {};
  };

  console.log('Nominee current form data', currentFormData);
  const handleAddNomineeClick = () => {
    const newNomineeEntry = createNewNomineeEntry();
    setCurrentFormData(newNomineeEntry);
    setIsEditing(false);
    setEditIndex(null);
    setOpenAddNominee(true);
  };

  const handleEditNomineeClick = (row: any, rowIndex: number) => {
    setCurrentFormData({ ...row });
    setIsEditing(true);
    setEditIndex(rowIndex);
    setOpenAddNominee(true);
  };

  // Handler to add new nominee entry to the end of tableData
  const handleAddNewNominee = () => {
    setFieldData((prevState: any) => {
      const prevTableData = prevState.nomineeTabData.tableData || [];
      return {
        ...prevState,
        nomineeTabData: {
          ...prevState.nomineeTabData,
          tableData: [
            ...prevTableData,
            currentFormData
          ]
        }
      };
    });
    setOpenAddNominee(false);
  };

  // Handler to update existing nominee entry
  const handleUpdateNominee = () => {
    if (editIndex === null) return;

    setFieldData((prevState: any) => {
      const prevTableData = [...(prevState.nomineeTabData.tableData || [])];
      prevTableData[editIndex] = currentFormData;

      return {
        ...prevState,
        nomineeTabData: {
          ...prevState.nomineeTabData,
          tableData: prevTableData
        }
      };
    });
    setOpenAddNominee(false);
  };


  const handleErrorChange = (updateFn: (prev: any) => any) => {
    setFieldData((prevState: any) => {
      const prevFieldErrors = prevState.nomineeTabData.fieldErrors || {};
      const updatedErrors = updateFn(prevFieldErrors);
      return {
        ...prevState,
        nomineeTabData: {
          ...prevState.nomineeTabData,
          fieldErrors: updatedErrors
        }
      };
    });
  };

  const columns = [
    { key: 'NomSerial', name: 'Serial', sortable: false },
    { key: 'NomFirstName', name: 'First Name', sortable: false },
    { key: 'NomMiddleName', name: 'Middle Name', sortable: false },
    { key: 'NomLastName', name: 'Last Name', sortable: false },
    { key: 'NomRelation', name: 'Relation', sortable: false },
    { key: 'NomPercentage', name: 'Percentage', sortable: false },
    { key: 'NomMobile', name: 'Mobile', sortable: false },
    { key: 'NomineeDOB', name: 'Date of Birth', sortable: false },
    { key: 'NomineePAN', name: 'PAN', sortable: false },
    { key: 'NomineeUID', name: 'UID', sortable: false },
    {
      key: 'actions',
      name: 'Actions',
      renderCell: ({ row, rowIndex }: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditNomineeClick(row, rowIndex)}
            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            Edit
          </button>
        </div>
      )
    },
  ];

  useEffect(() => {
    if (formFields && formFields.length > 0) {
      formFields.forEach((field) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setNomineeDropdownOptions, setNomineeLoadingDropdowns);
        }
      });
    }
  }, []);

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end">
        <button
          onClick={handleAddNomineeClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-3"
        >
          Add Nominee
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
      {openAddNominee && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-xl font-semibold mb-4">
              {isEditing ? 'Edit Nominee Details' : 'Add Nominee Details'}
            </h4>
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
              setFormValues={(newValues) => {
                // Directly update the local state only
                setCurrentFormData(newValues);
              }}
              onDropdownChange={() => { }}
              dropdownOptions={nomineeDropdownOptions}
              loadingDropdowns={nomineeLoadingDropdowns}
              fieldErrors={fieldErrors}
              setFieldErrors={handleErrorChange}
              setFormData={() => { }}
              setValidationModal={setValidationModal}
              setDropDownOptions={() => { }}
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setOpenAddNominee(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdateNominee : handleAddNewNominee}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nominee;