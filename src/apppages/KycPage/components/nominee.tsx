import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import { useTheme } from "@/context/ThemeContext";
import { fetchEkycDropdownOptions } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import moment from 'moment';
import { useAppSelector } from '@/redux/hooks';
import { selectAllMenuItems } from '@/redux/features/menuSlice';
import { findPageData } from '@/utils/helper';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import { toast } from 'react-toastify';

const Nominee = ({ formFields, tableData, setFieldData }: EkycComponentProps) => {
  const { colors, fonts } = useTheme();
  const [openAddNominee, setOpenAddNominee] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<any>({});
  const [nomineeDropdownOptions, setNomineeDropdownOptions] = useState<Record<string, any[]>>({});
  const [nomineeLoadingDropdowns, setNomineeLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    callback?: (confirmed: boolean) => void;
  }>({ isOpen: false, message: '', type: 'M' });
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null); 
  const [isMinor, setIsMinor] = useState(false);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [guardianFormData, setGuardianFormData] = useState<any>({});
  const [gurdianFileds, setGurdianFields] = useState<any>([]);
  const [guardianDropdownOptions, setGuardianDropdownOptions] = useState<Record<string, any[]>>({});
  const [guardianLoadingDropdowns, setGuardianLoadingDropdowns] = useState<Record<string, boolean>>({});
  const [guardianFieldErrors, setGuardianFieldErrors] = useState<Record<string, string>>({});
  const menuItems = useAppSelector(selectAllMenuItems);
  const pageData: any = findPageData(menuItems, "rekyc");

  console.log("current gurdian form data--->", guardianFormData);

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
  const handleAddNomineeClick = () => {
    const newNomineeEntry = createNewNomineeEntry();
    setCurrentFormData(newNomineeEntry);
    setIsEditing(false);
    setEditIndex(null);
    setOpenAddNominee(true);
    setShowGuardianForm(false);
    setIsMinor(false);
    // Clear all errors when adding new nominee
    setFieldErrors({});
    setGuardianFieldErrors({});
  };
  const handleEditNomineeClick = (row: any, rowIndex: number) => {
    setCurrentFormData({ ...row });
    setGuardianFormData(row.GuardianDetails || {});
    setIsEditing(true);
    setEditIndex(rowIndex);
    setOpenAddNominee(true);
    setShowGuardianForm(!!row.GuardianDetails);
    checkIfMinor(row.NomineeDOB);
    // Clear all errors when editing nominee
    setFieldErrors({});
    setGuardianFieldErrors({});
  };

  // Check if nominee is minor based on DOB using moment.js
  const checkIfMinor = (dob: string) => {
    if (!dob) {
      setIsMinor(false);
      return false;
    }

    const birthDate = moment(dob, 'YYYYMMDD');
    if (!birthDate.isValid()) {
      setIsMinor(false);
      return false;
    }

    const age = moment().diff(birthDate, 'years');
    const minor = age < 18;
    setIsMinor(minor);
    return minor;
  };
  // Validate mandatory fields for nominee
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

  // Validate mandatory fields for guardian
  const validateGuardianMandatoryFields = (formData: any) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    gurdianFileds.forEach((field: any) => {
      if (field.isMandatory === "true" && !formData[field.wKey]) {
        errors[field.wKey] = `${field.label} is required`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };
  // Handler to add/update nominee entry
  const handleSaveNominee = () => {
    const { isValid, errors } = validateMandatoryFields(currentFormData);
    setFieldErrors(errors);

    if (!isValid) {
      return;
    }

    const isMinorNominee = checkIfMinor(currentFormData.NomineeDOB);

    if (isMinorNominee && !showGuardianForm) {
      toast.error('Nominee is a minor. Please add guardian details before saving.')
      return;
    }

    // Validate guardian form if it's shown
    if (showGuardianForm) {
      const { isValid: isGuardianValid, errors: guardianErrors } = validateGuardianMandatoryFields(guardianFormData);
      setGuardianFieldErrors(guardianErrors);

      if (!isGuardianValid) {
        toast.error("Please fill all mandatory guardian details before saving.")
        return;
      }
    }

    const nomineeData = {
      ...currentFormData,
      GuardianDetails: showGuardianForm ? guardianFormData : null
    };

    if (isEditing && editIndex !== null) {
      setFieldData((prevState: any) => {
        const prevTableData = [...(prevState.nomineeTabData.tableData || [])];
        prevTableData[editIndex] = nomineeData;

        return {
          ...prevState,
          nomineeTabData: {
            ...prevState.nomineeTabData,
            tableData: prevTableData
          }
        };
      });
    } else {
      setFieldData((prevState: any) => {
        const prevTableData = prevState.nomineeTabData.tableData || [];
        return {
          ...prevState,
          nomineeTabData: {
            ...prevState.nomineeTabData,
            tableData: [
              ...prevTableData,
              nomineeData
            ]
          }
        };
      });
    }
    clearFormAndCloseModal();
  }; const toggleGuardianForm = () => {
    setShowGuardianForm(!showGuardianForm);
    // Clear guardian errors when toggling the form
    if (showGuardianForm) {
      setGuardianFieldErrors({});
    }
  };
  // Function to clear all form values and reset modal state
  const clearFormAndCloseModal = () => {
    setCurrentFormData({});
    setGuardianFormData({});
    setFieldErrors({});
    setGuardianFieldErrors({});
    setShowGuardianForm(false);
    setIsMinor(false);
    setIsEditing(false);
    setEditIndex(null);
    setOpenAddNominee(false);
  };

  const columns = [
    { key: 'NomSerial', name: 'Serial', sortable: false },
    { key: 'NomFirstName', name: 'First Name', sortable: false },
    { key: 'NomMiddleName', name: 'Middle Name', sortable: false },
    { key: 'NomLastName', name: 'Last Name', sortable: false },
    { key: 'NomRelation', name: 'Relation', sortable: false },
    { key: 'NomPercentage', name: 'Percentage', sortable: false },
    { key: 'NomMobile', name: 'Mobile', sortable: false },
    {
      key: 'NomineeDOB',
      name: 'Date of Birth',
      sortable: false,
      renderCell: ({ row }: any) => moment(row.NomineeDOB, 'YYYYMMDD').format('DD/MM/YYYY')
    },
    { key: 'NomineePAN', name: 'PAN', sortable: false },
    { key: 'NomineeUID', name: 'UID', sortable: false },
    {
      key: 'actions',
      name: 'Actions',
      renderCell: (props: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditNomineeClick(props.row, props.rowIdx)}
            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            Edit
          </button>
        </div>
      )
    },
];
  const fetchFormData = async () => {
    if (!pageData?.[0]?.Entry) return;
    try {
      const entry = pageData[0].Entry;
      const childEntry = entry.ChildEntry;
      console.log("childEntry", childEntry);
      const sql = Object.keys(childEntry?.sql || {}).length ? childEntry.sql : "";

      // Construct J_Ui - handle 'Option' key specially
      const jUi = Object.entries(childEntry.J_Ui)
        .map(([key, value]) => {
          return `"${key}":"${value}"`;
        })
        .join(',');

      // Construct J_Api
      const jApi = Object.entries(childEntry.J_Api)
        .map(([key, value]) => `"${key}":"${value}"`)
        .join(',');

      // Construct X_Filter with edit data if available
      let xFilter = '';
      Object.entries(childEntry.X_Filter).forEach(([key, value]) => {
        if (key === 'NomSerial') {
          xFilter += `<${key}></${key}>`;
        } else {
          xFilter += `<${key}>${value}</${key}>`;
        }
      });

      const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${sql}</Sql>
                <X_Filter>${xFilter}</X_Filter>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

      const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
        }
      });
      let formData = response?.data?.data?.rs0[0].Data || [];
      console.log("Fetched form data:", formData);
      setGurdianFields(formData)
      // Initialize form values with any preset values
      const initialValues: Record<string, any> = {};
      formData.forEach((field: any) => {
        if (field.type === 'WDateBox' && field.wValue) {
          initialValues[field.wKey] = moment(field.wValue).format('YYYYMMDD');
        } else {
          initialValues[field.wKey] = '';
        }

      });
      setGuardianFormData(initialValues);
      console.log("initial vaues", initialValues);
    } catch (error) {
      console.error('Error fetching childEntry data:', error);

    } finally {

    }
  };

  useEffect(() => {
    if (formFields && formFields.length > 0) {
      formFields.forEach((field) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setNomineeDropdownOptions, setNomineeLoadingDropdowns);
        }
      });
    }
  }, [formFields]);

  // useEffect to fetch dropdown options for guardian fields
  useEffect(() => {
    if (gurdianFileds && gurdianFileds.length > 0) {
      gurdianFileds.forEach((field: any) => {
        if (field.wQuery && field.wKey) {
          fetchEkycDropdownOptions(field, setGuardianDropdownOptions, setGuardianLoadingDropdowns);
        }
      });
    }
  }, [gurdianFileds]);

  useEffect(() => {
    if (pageData?.[0]?.Entry) {
      fetchFormData()
    }
  }, [pageData])

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
            <div className="flex justify-between items-center gap-4 mt-2 mb-4">
              <h4 className="text-xl font-semibold">
                {isEditing ? 'Edit Nominee Details' : 'Add Nominee Details'}
              </h4>              <div className="flex gap-4">
                <button
                  onClick={clearFormAndCloseModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNominee}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            {isMinor && !showGuardianForm && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>Nominee is a minor. Please add guardian details.</p>
              </div>
            )}

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
                setCurrentFormData(newValues);
              }}
              onDropdownChange={() => { }}
              dropdownOptions={nomineeDropdownOptions}
              loadingDropdowns={nomineeLoadingDropdowns}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              setFormData={() => { }}
              setValidationModal={setValidationModal}
              setDropDownOptions={() => { }}
            />

            {isMinor && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Guardian Details</h4>
                  <button
                    onClick={toggleGuardianForm}
                    className={`px-4 py-2 rounded-md ${showGuardianForm ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    {showGuardianForm ? 'Remove Guardian' : 'Add Guardian'}
                  </button>
                </div>                {showGuardianForm && (
                  <div className="border-t pt-4">
                    <EkycEntryForm
                      formData={gurdianFileds}
                      formValues={guardianFormData}
                      masterValues={{}}
                      setFormValues={setGuardianFormData}
                      onDropdownChange={() => { }}
                      dropdownOptions={guardianDropdownOptions}
                      loadingDropdowns={guardianLoadingDropdowns}
                      fieldErrors={guardianFieldErrors}
                      setFieldErrors={setGuardianFieldErrors}
                      setFormData={() => { }}
                      setValidationModal={setValidationModal}
                      setDropDownOptions={setGuardianDropdownOptions}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Nominee;