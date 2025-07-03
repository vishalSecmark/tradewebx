import EkycEntryForm from '@/components/component-forms/EkycEntryForm';
import { EkycComponentProps } from '@/types/EkycFormTypes';
import React, { useEffect, useState } from 'react'
import { fetchEkycDropdownOptions, handleDigiLockerCallBackAPI, handleSaveSinglePageData, SubmitEkycForm } from '../ekychelper';
import CaseConfirmationModal from '@/components/Modals/CaseConfirmationModal';
import { IoArrowBack } from 'react-icons/io5';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'react-toastify';
import { useSaveLoading } from '@/context/SaveLoadingContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocalStorageListener } from '@/hooks/useLocalStorageListner';


const Documents = ({ formFields, tableData, fieldErrors, setFieldData, setActiveTab, Settings }: EkycComponentProps) => {
    const { colors } = useTheme();
    const { setSaving } = useSaveLoading();
    const viewMode = useLocalStorageListener("ekyc_viewMode", false);
    const enableSubmitBtn = useLocalStorageListener("ekyc_submit", false);
    const ekycChecker = useLocalStorageListener("ekyc_checker", false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const success = searchParams.get('success');
    const id = searchParams.get('id');
    const scope = searchParams.get('scope');


    const [personalDropdownOptions, setPersonalDropdownOptions] = useState<Record<string, any[]>>({});
    const [personalLoadingDropdowns, setPersonalLoadingDropdowns] = useState<Record<string, boolean>>({});
    const [fieldValues, setFieldValues] = useState<Record<string, any>>(tableData[0] || {});
    const [attachmentsFieldErrors, setAttachmentsFieldErrors] = useState<Record<string, string>>(fieldErrors || {});
    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        message: string;
        type: 'M' | 'S' | 'E' | 'D';
        callback?: (confirmed: boolean) => void;
    }>({ isOpen: false, message: '', type: 'M' });

    const [kraESignSubmit, setKraEsignSubmit] = useState(false);
    const [finalESignSubmit, setFinalEsignSubmit] = useState(false);

    console.log("check the sumit button", enableSubmitBtn)



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
        const { isValid, errors } = validateMandatoryFields(fieldValues);
        setAttachmentsFieldErrors(errors);
        if (!isValid) {
            toast.error("Please fill all mandatory fields");
            return;
        } else {
            const transformedData = transformData(tableData[0] || {});
            console.log('Transformed Data:', transformedData);
            handleSaveSinglePageData(
                Settings.SaveNextAPI,
                transformedData,
                setActiveTab,
                "attachments",
                setSaving
            )
        }
    }

    const handleSubmit = () => {
        const rawData = localStorage.getItem("ekyc_dynamicData");
        const storedFormData = JSON.parse(rawData);
        const constructPayload: any = {
            RekycJson: [
                {
                    ReKycDetails: [
                        {
                            KycMode: "Online",
                            NomineeOpt: "",
                            IsNomineeModified: "",
                            IsBankModified: "",
                            IsDematModified: ""
                        }
                    ],
                    PersonalDetails: storedFormData?.personalTabData?.tableData || [],
                    NomineeDetails: storedFormData?.nomineeTabData?.tableData || [],
                    BankDetails: storedFormData?.bankTabData?.tableData || [],
                    DematDetails: storedFormData?.dematTabData?.tableData || [],
                    SegmentDetails: storedFormData?.segmentTabData?.tableData || [],
                }
            ]
        }
        console.log("check submit data", JSON.parse(rawData));
        console.log("check constructed payload", constructPayload);

        SubmitEkycForm(Settings?.MakerSaveAPI, constructPayload, setSaving, Settings);
    }


    useEffect(() => {
        if (scope && scope.includes("ADHAR") && success === "True" && localStorage.getItem("redirectedField") === "FinalFormSubmission") {
            const redirectedField = localStorage.getItem('redirectedField')

            console.log("calling third part", redirectedField)
            // rekyc?success=True&id=f2794eec-0e60-4084-8c0f-77ca0790c769&scope=ADHAR%2BPANCR
            handleDigiLockerCallBackAPI(Settings);
            router.replace(window.location.pathname);
        }
    }, [scope, success])

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
                {!viewMode && (
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
                            style={{
                                backgroundColor: enableSubmitBtn ? colors.buttonBackground : '#cccccc',
                                color: enableSubmitBtn ? colors.buttonText : '#666666',
                                cursor: enableSubmitBtn ? 'pointer' : 'not-allowed',
                                border: `1px solid ${enableSubmitBtn ? colors.buttonBackground : '#cccccc'}`
                            }}
                            className="px-4 py-1 rounded-lg ml-4 transition-colors duration-200"
                            disabled={!enableSubmitBtn}
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>

                    </div>
                )}
                {ekycChecker && (
                    <div className="text-end">
                        <button
                            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={true}
                        >
                            KRA PDF-Gen
                        </button>
                        <button
                            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={true}
                        >
                            KRA E-Sign
                        </button>
                        <button
                            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={true}
                        >
                            Final PDF-Gen
                        </button>
                        <button
                            style={{ backgroundColor: colors.buttonBackground, color: colors.buttonText }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={true}
                        >
                            Final-ESign
                        </button>
                    </div>
                )}
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
                formValues={fieldValues}
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
                viewMode={viewMode}
            />
        </div>
    )
}

export default Documents;