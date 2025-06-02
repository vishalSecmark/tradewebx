import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes'
import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';

import { useTheme } from "@/context/ThemeContext";

const Nominee = ({ formFields, tableData, fieldErrors }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddBank, setOpenAddBank] = useState(false);

 
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
    { key: 'NomAddress1', name: 'Address 1', sortable: false },
    { key: 'NomAddress2', name: 'Address 2', sortable: false },
    { key: 'NomAddress3', name: 'Address 3', sortable: false },
    { key: 'NomAddressCity', name: 'City', sortable: false },
    { key: 'NomAddressState', name: 'State', sortable: false },
    { key: 'NomAddressCountry', name: 'Country', sortable: false },
    { key: 'NomPincode', name: 'Pincode', sortable: false },
    { key: 'NomineeResidualSecurities', name: 'Residual Securities', sortable: false },
    { key: 'NomineeAttachment', name: 'Attachment', sortable: false },
    { key: 'IsNomineeDeleted', name: 'Deleted', sortable: false },
  ];

  return (
    <div className="w-full p-5 bg-white rounded-lg shadow-md">
      <div className="text-end">
        <button 
          onClick={() => setOpenAddBank(true)}
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
      {openAddBank && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-xl font-semibold mb-4">Add Nominee Details</h4>

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

export default Nominee;