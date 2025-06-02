import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions } from '../ekychelper';


const Personal = ({ formFields, tableData, fieldErrors , setFieldData }: EkycComponentProps) => {
    console.log('personal tab', formFields, tableData);
    const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    const [fieldVlaues, setFieldValues] = useState<Record<string, any>>({});
    
    console.log('personalDropdownOptions', personalDropdownOptions);
    console.log('personalLoadingDropdowns', personalLoadingDropdowns);
    
    console.log('FieldValue', fieldVlaues);

    useEffect(()=>{
        if (formFields && formFields.length > 0) {
            formFields.forEach((field) => {
                if (field.wQuery && field.wKey) {
                    // Fetch dropdown options for each field with a query
                    fetchEkycDropdownOptions(field, setPersonalDropdownOptions, setPersonalLoadingDropdowns);
                }
            })
        }
    },[])

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

    return (
        <div className="w-full p-5 bg-white rounded-lg shadow-md">
            <EkycEntryForm
                formData={formFields}
                formValues={tableData[0] || {}}
                masterValues={{}}
                setFormValues={handleFieldChange}
                onDropdownChange={() => { }}
                dropdownOptions={personalDropdownOptions}
                loadingDropdowns={personalLoadingDropdowns}
                fieldErrors={fieldErrors}
                setFieldErrors={() => { }}
                setFormData={() => { }}
                setValidationModal={() => { }}
                setDropDownOptions={() => { }}
            />
        </div>
    )
}

export default Personal