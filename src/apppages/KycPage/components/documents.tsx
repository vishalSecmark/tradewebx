import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions, handleSaveSinglePageData } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { IoArrowBack } from 'react-icons/io5';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-toastify';
import { useSaveLoading } from '@/context/SaveLoadingContext';



const Documents = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab, Settings }: EkycComponentProps) => {
    console.log('personal tab', formFields, tableData);
    const { colors, fonts } = useTheme();
    const { setSaving } = useSaveLoading();
    
    const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    const [fieldVlaues, setFieldValues] = useState<Record<string, any>>(tableData[0] || {});
    const [attachmentsFieldErrors, setAttachmentsFieldErrors] = useState<Record<string, string>>(fieldErrors || {});
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
        console.log('handleFieldChange called with updateFn:', updateFn);
        setFieldData((prevState: any) => {
            const prevTableData = prevState.attachments.tableData || [];
            const updatedRow = updateFn(prevTableData[0] || {});
            // console.log('handleFieldChange called with updateFn:', updatedRow);
            return {
                ...prevState,
                attachments: {
                    ...prevState.attachments,
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


    function transformData(inputData: any) {
        const result = {};

        for (const [key, value] of Object.entries(inputData)) {
            if (value && typeof value === 'object' && 'data' in value) {
                result[key] = value.data;
            } else {
                result[key] = value
            }
        }

        return [result];
    }


    const handleSave = () => {
        const { isValid, errors } = validateMandatoryFields(fieldVlaues);
        setAttachmentsFieldErrors(errors);
        if (!isValid) {
            toast.error("Please fill all mandatory fields");
            return;
        } else {
            const transformedData = transformData(tableData[0] || {});
            console.log('Transformed Data:', transformedData);
            handleSaveSinglePageData(Settings.SaveNextAPI, transformedData, setActiveTab, "attachments", setSaving)
        }
    }
    return (
        <div className="w-full p-5 pt-2 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-2">
                <button
                    className="rounded-lg px-4 py-1"
                    style={{
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.buttonBackground}`,
                    }} 
                    onClick={() => setActiveTab("segment")}
                >
                    <IoArrowBack size={20} />
                </button>

                <div className="text-end">
                    <button
                        className="px-4 py-1 rounded-lg ml-4"
                        style={{
                            backgroundColor: colors.background,
                            border: `1px solid ${colors.buttonBackground}`
                        }}
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
                        className="px-4 py-1 rounded-lg ml-4"
                    >
                        Submit
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
                formData={formFields}
                formValues={fieldVlaues}
                masterValues={{}}
                setFormValues={handleFieldChange}
                onDropdownChange={() => { }}
                dropdownOptions={personalDropdownOptions}
                loadingDropdowns={personalLoadingDropdowns}
                fieldErrors={attachmentsFieldErrors}
                setFieldErrors={setAttachmentsFieldErrors}
                setFormData={() => { }}
                setValidationModal={setValidationModal}
                setDropDownOptions={() => { }}
            />
        </div>
    )
}

export default Documents;