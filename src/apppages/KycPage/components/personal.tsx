import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions } from '../ekychelper';


const Personal = ({ formFields, tableData, fieldErrors }: EkycComponentProps) => {
    console.log('personal tab', formFields, tableData);
     const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    
    console.log('personalDropdownOptions', personalDropdownOptions);
    console.log('personalLoadingDropdowns', personalLoadingDropdowns);
    

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

    return (
        <div className="w-full p-5 bg-white rounded-lg shadow-md">
            <EkycEntryForm
                formData={formFields}
                formValues={tableData[0] || {}}
                masterValues={{}}
                setFormValues={() => { }}
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