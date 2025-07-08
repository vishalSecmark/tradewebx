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
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';

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
    const signerIdentifier = searchParams.get('signerIdentifier');
    const esp = searchParams.get('esp');

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

    // State for button enabling and PDF data
    const [kraPdfData, setKraPdfData] = useState<any | null>(null);
    const [finalPdfData, setFinalPdfData] = useState<any | null>(null);
    const [kraPdfGenerated, setKraPdfGenerated] = useState(false);
    const [kraESignEnabled, setKraESignEnabled] = useState(false);
    const [finalPdfGenerated, setFinalPdfGenerated] = useState(false);
    const [finalESignEnabled, setFinalESignEnabled] = useState(false);
    const [isGeneratingKraPdf, setIsGeneratingKraPdf] = useState(false);
    const [isGeneratingFinalPdf, setIsGeneratingFinalPdf] = useState(false);
    const [isSigningKra, setIsSigningKra] = useState(false);
    const [isSigningFinal, setIsSigningFinal] = useState(false);

    // Load state from localStorage on component mount
    useEffect(() => {
        const loadState = () => {
            const savedState = localStorage.getItem('ekyc_pdf_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                setKraPdfData(state.kraPdfData || null);
                setFinalPdfData(state.finalPdfData || null);
                setKraPdfGenerated(state.kraPdfGenerated || false);
                setKraESignEnabled(state.kraESignEnabled || false);
                setFinalPdfGenerated(state.finalPdfGenerated || false);
                setFinalESignEnabled(state.finalESignEnabled || false);
            }
        };
        loadState();
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (ekycChecker) {
            localStorage.setItem('ekyc_pdf_state', JSON.stringify({
                kraPdfData,
                finalPdfData,
                kraPdfGenerated,
                kraESignEnabled,
                finalPdfGenerated,
                finalESignEnabled
            }));
        }
    }, [kraPdfData, finalPdfData, kraPdfGenerated, kraESignEnabled, finalPdfGenerated, finalESignEnabled, ekycChecker]);

    // Handle E-Sign callback
    useEffect(() => {
        if (success === 'true' && id && signerIdentifier && esp) {
            const savedState = localStorage.getItem('ekyc_esign_state');
            if (savedState) {
                const state = JSON.parse(savedState);

                if (state.currentStep === 'kra_esign_completed') {
                    setFinalPdfGenerated(true);
                    toast.success("KRA E-Sign completed successfully");
                } else if (state.currentStep === 'final_esign_completed') {
                    toast.success("Final E-Sign completed successfully");
                }

                localStorage.removeItem('ekyc_esign_state');
                router.replace(window.location.pathname);
            }
        }
    }, [success, id, signerIdentifier, esp, router]);

    useEffect(() => {
        if (formFields && formFields.length > 0) {
            formFields.forEach((field) => {
                if (field.wQuery && field.wKey) {
                    fetchEkycDropdownOptions(field, setPersonalDropdownOptions, setPersonalLoadingDropdowns);
                }
            })
        }
    }, [formFields]);

    const handleFieldChange = (updateFn: (prev: any) => any) => {
        setFieldData((prevState: any) => {
            const prevTableData = prevState.attachments.tableData || [];
            const updatedRow = updateFn(prevTableData[0] || {});
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
                result[key] = value;
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
            handleSaveSinglePageData(
                Settings.SaveNextAPI,
                transformedData,
                setActiveTab,
                "attachments",
                setSaving
            );
        }
    };

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
        };
        SubmitEkycForm(Settings?.MakerSaveAPI, constructPayload, setSaving, Settings);
    };


    const handleGenerateKraPdf = async () => {
        setIsGeneratingKraPdf(true);
        try {
            const userId = localStorage.getItem('userId') || 'ADMIN';
            const accYear = localStorage.getItem('accYear') || '24';
            const myDbPrefix = localStorage.getItem('myDbPrefix') || 'undefined';
            const memberCode = localStorage.getItem('memberCode') || 'undefined';
            const secretKey = localStorage.getItem('secretKey') || 'undefined';
            const menuCode = localStorage.getItem('menuCode') || '27';

            const xmlData = `<dsXml>
                <J_Ui>"ActionName":"TradeWeb","Option":"KRAPDF","RequestFrom":"W"</J_Ui>
                <Sql></Sql>
                <X_Filter></X_Filter>
                <X_Filter_Multiple></X_Filter_Multiple>
                <X_Data></X_Data>
                <J_Api>"UserId":"${userId}","AccYear":"${accYear}","MyDbPrefix":"${myDbPrefix}","MemberCode":"${memberCode}","SecretKey":"${secretKey}","MenuCode":"${menuCode}"</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.data?.rs0?.[0]?.Flag === 'E') {
                await handleGenerateRekycPdf('KRAPDF');
            } else if (response.data?.data?.rs0?.[0]?.Base64PDF) {
                const pdfData = response.data.data.rs0[0];
                setKraPdfData(pdfData);
                setKraPdfGenerated(true);
                setKraESignEnabled(true);
                toast.success("KRA PDF generated successfully");
            } else {
                toast.error("Failed to generate KRA PDF");
            }
        } catch (error) {
            console.error("Error generating KRA PDF:", error);
            toast.error("Error generating KRA PDF");
        } finally {
            setIsGeneratingKraPdf(false);
        }
    };

    const handleGenerateRekycPdf = async (reportName: string) => {
        try {
            const userId = localStorage.getItem('userId') || 'ADMIN';
            const entryName = 'REKYC';
            const clientCode = userId;

            const xmlData = `<dsXml>
                <J_Ui>"ActionName":"TradeWeb","Option":"GenerateRekycPDF","RequestFrom":"W","ReportDisplay":"D"</J_Ui>
                <Sql></Sql>
                <X_Filter></X_Filter>
                <X_Filter_Multiple></X_Filter_Multiple>
                <X_Data>
                    <ReportName>${reportName}</ReportName>
                    <EntryName>${entryName}</EntryName>
                    <ClientCode>${clientCode}</ClientCode>
                </X_Data>
                <J_Api>"UserId":"${userId}"</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.data?.rs0?.[0]?.Base64PDF) {
                const pdfData = response.data.data.rs0[0];
                if (reportName === 'KRAPDF') {
                    setKraPdfData(pdfData);
                    setKraPdfGenerated(true);
                    setKraESignEnabled(true);
                    toast.success("KRA PDF generated successfully");
                } else {
                    setFinalPdfData(pdfData);
                    setFinalPdfGenerated(true);
                    setFinalESignEnabled(true);
                    toast.success("Final PDF generated successfully");
                }
            } else {
                toast.error(`Failed to generate ${reportName} PDF`);
            }
        } catch (error) {
            console.error(`Error generating ${reportName} PDF:`, error);
            toast.error(`Error generating ${reportName} PDF`);
        }
    };

    const handleKraESign = async () => {
        if (!kraPdfData) {
            toast.error("No KRA PDF available for E-Sign");
            return;
        }

        try {
            setIsSigningKra(true);
            const userId = localStorage.getItem('userId') || 'ADMIN';

            const J_Ui = {
                ActionName: "Rekyc",
                Option: "EsignRequest"
            };
            const Sql = null;
            const X_Filter = "";
            const X_Filter_Multiple = {
                ClientCode: userId,
                base64: kraPdfData?.Base64PDF,
                pdfpage: kraPdfData?.TotalPages?.toString(),
                FileType: "KRAPDF"
            };
            const J_Api = {
                UserId: userId
            };

            let xFilterMultiple = '';
            Object.entries(X_Filter_Multiple).forEach(([key, value]) => {
                xFilterMultiple += `<${key}>${value}</${key}>`;
            });

            const jUi = Object.entries(J_Ui).map(([key, value]) => `"${key}":"${value}"`).join(',');
            const jApi = Object.entries(J_Api).map(([key, value]) => `"${key}":"${value}"`).join(',');

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${Sql || ''}</Sql>
                <X_Filter>${X_Filter}</X_Filter>
                <X_Filter_Multiple>${xFilterMultiple}</X_Filter_Multiple>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.success) {
                const columnData = response.data?.data?.rs0?.[0]?.Column1;
                console.log("KRA E-Sign response column data:", columnData);

                if (columnData) {
                    try {
                        // Parse the XML string to extract the Url
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(columnData, 'text/html');
                        const url = doc.querySelector('Url')?.textContent;
                        console.log("Parsed XML Document:", url);

                        console.log("check url", url)
                        if (url) {
                            localStorage.setItem('ekyc_esign_state', JSON.stringify({
                                kraPdfData,
                                finalPdfData,
                                kraPdfGenerated: true,
                                kraESignEnabled: true,
                                finalPdfGenerated: false,
                                finalESignEnabled: false,
                                currentStep: 'kra_esign_completed'
                            }));
                            window.open(url, '_self');
                            return;
                        } else {
                            toast.error("No URL found in E-Sign response");
                        }
                    } catch (error) {
                        console.error("Error parsing E-Sign response:", error);
                        toast.error("Error processing E-Sign response");
                    }
                }
            } else {
                toast.error(response.data?.message || "Failed to initiate KRA E-Sign");
            }
        } catch (error) {
            console.error("Error during KRA E-Sign:", error);
            toast.error("Error during KRA E-Sign");
        } finally {
            setIsSigningKra(false);
        }
    };

    const handleGenerateFinalPdf = async () => {
        setIsGeneratingFinalPdf(true);
        try {
            const userId = localStorage.getItem('userId') || 'ADMIN';
            const accYear = localStorage.getItem('accYear') || '24';
            const myDbPrefix = localStorage.getItem('myDbPrefix') || 'undefined';
            const memberCode = localStorage.getItem('memberCode') || 'undefined';
            const secretKey = localStorage.getItem('secretKey') || 'undefined';
            const menuCode = localStorage.getItem('menuCode') || '27';

            const xmlData = `<dsXml>
                <J_Ui>"ActionName":"TradeWeb","Option":"FinalPDF","RequestFrom":"W"</J_Ui>
                <Sql></Sql>
                <X_Filter></X_Filter>
                <X_Filter_Multiple></X_Filter_Multiple>
                <X_Data></X_Data>
                <J_Api>"UserId":"${userId}","AccYear":"${accYear}","MyDbPrefix":"${myDbPrefix}","MemberCode":"${memberCode}","SecretKey":"${secretKey}","MenuCode":"${menuCode}"</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.data?.rs0?.[0]?.Flag === 'E') {
                await handleGenerateRekycPdf('FINALPDF');
            } else if (response.data?.data?.rs0?.[0]?.Base64PDF) {
                setFinalPdfData(response.data.data.rs0[0]);
                setFinalPdfGenerated(true);
                setFinalESignEnabled(true);
                toast.success("Final PDF generated successfully");
            } else {
                toast.error("Failed to generate Final PDF");
            }
        } catch (error) {
            console.error("Error generating Final PDF:", error);
            toast.error("Error generating Final PDF");
        } finally {
            setIsGeneratingFinalPdf(false);
        }
    };

    const handleFinalESign = async () => {
        if (!finalPdfData) {
            toast.error("No Final PDF available for E-Sign");
            return;
        }

        try {
            setIsSigningFinal(true);
            const userId = localStorage.getItem('userId') || 'ADMIN';

            const J_Ui = {
                ActionName: "Rekyc",
                Option: "EsignRequest"
            };
            const Sql = null;
            const X_Filter = "";
            const X_Filter_Multiple = {
                ClientCode: userId,
                base64: finalPdfData.Base64PDF,
                pdfpage: finalPdfData.TotalPages.toString(),
                FileType: "FINALPDF"
            };
            const J_Api = {
                UserId: userId
            };

            let xFilterMultiple = '';
            Object.entries(X_Filter_Multiple).forEach(([key, value]) => {
                xFilterMultiple += `<${key}>${value}</${key}>`;
            });

            const jUi = Object.entries(J_Ui).map(([key, value]) => `"${key}":"${value}"`).join(',');
            const jApi = Object.entries(J_Api).map(([key, value]) => `"${key}":"${value}"`).join(',');

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${Sql || ''}</Sql>
                <X_Filter>${X_Filter}</X_Filter>
                <X_Filter_Multiple>${xFilterMultiple}</X_Filter_Multiple>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    Authorization: `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.success) {
                const columnData = response.data?.data?.rs0?.[0]?.Column1;
                if (columnData) {
                    try {
                        // Parse the XML string to extract the Url
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(columnData, 'text/html');
                        const url = doc.querySelector('Url')?.textContent;
                        console.log("Parsed XML Document:", url);

                    if (url) {
                        localStorage.setItem('ekyc_esign_state', JSON.stringify({
                            kraPdfData,
                            finalPdfData,
                            kraPdfGenerated: true,
                            kraESignEnabled: true,
                            finalPdfGenerated: true,
                            finalESignEnabled: true,
                            currentStep: 'final_esign_completed'
                        }));

                        window.open(url, '_self');
                        return;
                    }
                    else {
                            toast.error("No URL found in E-Sign response");
                        }
                    }catch(err){
                         console.error("Error parsing E-Sign response:", err);
                        toast.error("Error processing Final E-Sign response");
                    }
                }
            
            } else {
                toast.error(response.data?.message || "Failed to initiate Final E-Sign");
            }
        } catch (error) {
            console.error("Error during Final E-Sign:", error);
            toast.error("Error during Final E-Sign");
        } finally {
            setIsSigningFinal(false);
        }
    };

    useEffect(() => {
        if (scope && scope.includes("ADHAR") && success === "True" && localStorage.getItem("redirectedField") === "FinalFormSubmission") {
            handleDigiLockerCallBackAPI(Settings);
            router.replace(window.location.pathname);
        }
    }, [scope, success, Settings, router]);

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
                {(!viewMode && !ekycChecker) && (
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
                            style={{
                                backgroundColor: enableSubmitBtn ? colors.buttonBackground : '#cccccc',
                                color: enableSubmitBtn ? colors.buttonText : '#666666',
                                cursor: enableSubmitBtn ? 'pointer' : 'not-allowed'
                            }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={!enableSubmitBtn || isGeneratingKraPdf}
                            onClick={handleGenerateKraPdf}
                        >
                            {isGeneratingKraPdf ? 'Generating...' : 'KRA PDF-Gen'}
                        </button>
                        <button
                            style={{
                                backgroundColor: kraESignEnabled ? colors.buttonBackground : '#cccccc',
                                color: kraESignEnabled ? colors.buttonText : '#666666',
                                cursor: kraESignEnabled ? 'pointer' : 'not-allowed'
                            }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={!kraESignEnabled || isSigningKra}
                            onClick={handleKraESign}
                        >
                            {isSigningKra ? 'Signing...' : 'KRA E-Sign'}
                        </button>
                        <button
                            style={{
                                backgroundColor: finalPdfGenerated ? colors.buttonBackground : '#cccccc',
                                color: finalPdfGenerated ? colors.buttonText : '#666666',
                                cursor: finalPdfGenerated ? 'pointer' : 'not-allowed'
                            }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={!finalPdfGenerated || isGeneratingFinalPdf}
                            onClick={handleGenerateFinalPdf}
                        >
                            {isGeneratingFinalPdf ? 'Generating...' : 'Final PDF-Gen'}
                        </button>
                        <button
                            style={{
                                backgroundColor: finalESignEnabled ? colors.buttonBackground : '#cccccc',
                                color: finalESignEnabled ? colors.buttonText : '#666666',
                                cursor: finalESignEnabled ? 'pointer' : 'not-allowed'
                            }}
                            className="px-4 py-1 rounded-lg ml-4"
                            disabled={!finalESignEnabled || isSigningFinal}
                            onClick={handleFinalESign}
                        >
                            {isSigningFinal ? 'Signing...' : 'Final-ESign'}
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