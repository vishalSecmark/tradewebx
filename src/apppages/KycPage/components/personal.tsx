import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions, handleSaveSinglePageData } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-toastify';


const Personal = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab, Settings }: EkycComponentProps) => {

    const { colors, fonts } = useTheme();
    const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    const [fieldVlaues, setFieldValues] = useState<Record<string, any>>(tableData[0] || {});
    const [personalFieldErrors, setPersonalFieldErrors] = useState<Record<string, string>>({});
    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        message: string;
        type: 'M' | 'S' | 'E' | 'D';
        callback?: (confirmed: boolean) => void;
    }>({ isOpen: false, message: '', type: 'M' });

    useEffect(() => {
        if (formFields && formFields.length > 0) {
            formFields.forEach((field) => {
                if (field.wQuery && field.wKey) {
                    // Fetch dropdown options for each field with a query
                    fetchEkycDropdownOptions(field, setPersonalDropdownOptions, setPersonalLoadingDropdowns);
                }
            })
        }
    }, [])

    // Handler to update the 0th index of personalTabData.tableData in dynamicData
    const handleFieldChange = (updateFn: (prev: any) => any) => {
        setFieldData((prevState: any) => {
            const prevTableData = prevState.personalTabData.tableData || [];
            const updatedRow = updateFn(prevTableData[0] || {});
            return {
                ...prevState,
                personalTabData: {
                    ...prevState.personalTabData,
                    tableData: [
                        updatedRow,
                        ...prevTableData.slice(1)
                    ]
                }
            };
        });
        setFieldValues((prev: any) => updateFn(prev));
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


    const handleSaveAndNext = () => {
        const { isValid, errors } = validateMandatoryFields(fieldVlaues);
        setPersonalFieldErrors(errors);
        if (!isValid) {
            toast.error("Please fill all mandatory fields");
            return;
        } else {
            handleSaveSinglePageData(Settings.SaveNextAPI, tableData, setActiveTab , "nominee")
            // setActiveTab("nominee")
        }
    }
    return (
        <div className="w-full p-5 pt-2 bg-white rounded-lg shadow-md">
            <div className="text-end">
                <button
                    className="rounded-lg"
                    style={{
                        backgroundColor: colors.background,
                        padding: "10px"
                    }}
                    onClick={handleSaveAndNext}
                >
                    Save and Next
                </button>
            </div>
            <CaseConfirmationModal
                isOpen={validationModal.isOpen}
                message={validationModal.message}
                type={validationModal.type}
                onConfirm={() => validationModal.callback?.(true)}
                onCancel={() => validationModal.callback?.(false)}
            />
            <EkycEntryForm
                formData={formFields}
                formValues={tableData[0] || {}}
                masterValues={{}}
                setFormValues={handleFieldChange}
                onDropdownChange={() => { }}
                dropdownOptions={personalDropdownOptions}
                loadingDropdowns={personalLoadingDropdowns}
                fieldErrors={personalFieldErrors}
                setFieldErrors={setPersonalFieldErrors}
                setFormData={() => { }}
                setValidationModal={setValidationModal}
                setDropDownOptions={() => { }}
            />
        </div>
    )
}

export default Personal