import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { useTheme } from '@/context/ThemeContext';


const Personal = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab }: EkycComponentProps) => {
    console.log('personal tab', formFields, tableData);
    const { colors, fonts } = useTheme();
    const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    const [fieldVlaues, setFieldValues] = useState<Record<string, any>>({});
    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        message: string;
        type: 'M' | 'S' | 'E' | 'D';
        callback?: (confirmed: boolean) => void;
    }>({ isOpen: false, message: '', type: 'M' });



    console.log('personalDropdownOptions', personalDropdownOptions);
    console.log('personalLoadingDropdowns', personalLoadingDropdowns);

    console.log('FieldValue', fieldVlaues);

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

    const handleErrorChange = (updateFn: (prev: any) => any) => {
        setFieldData((prevState: any) => {
            const prevFieldErrors = prevState.personalTabData.fieldErrors || {};
            const updatedErrors = updateFn(prevFieldErrors);
            return {
                ...prevState,
                personalTabData: {
                    ...prevState.personalTabData,
                    fieldErrors: updatedErrors
                }
            };
        });
    }

    const handleSaveAndNext = ()     => {
        // Perform validation checks here   
    setActiveTab("nominee")
    }
    return (
        <div className="w-full p-5 bg-white rounded-lg shadow-md">
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
                fieldErrors={fieldErrors}
                setFieldErrors={handleErrorChange}
                setFormData={() => { }}
                setValidationModal={setValidationModal}
                setDropDownOptions={() => { }}
            />
        </div>
    )
}

export default Personal