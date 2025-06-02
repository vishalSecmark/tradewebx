"use client";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useState } from "react";
import Personal from './components/personal';
import Nominee from "./components/nominee";
import KycDemat from "./components/demat";
import Segment from "./components/segment";
import KycFinalPage from "./components/rekyc";
import KycBank from "./components/bank";
import { useAppSelector } from "@/redux/hooks";
import { selectAllMenuItems } from "@/redux/features/menuSlice";
import axios from "axios";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import moment from "moment";
import { findPageData } from "@/utils/helper";

interface TabData {
    id: string;
    label: string;
    content: React.ReactNode;
}

export default function Kyc() {
    const { colors, fonts } = useTheme();
    const menuItems = useAppSelector(selectAllMenuItems);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("personal");

    const [dynamicData, setDynamicData] = useState<any>({
        personalTabData: {
            formFields: [],
            tableData: [],
            fieldsErrors: {}
        },
        bankTabData: {
            formFields: [],
            tableData: [],
            fieldsErrors: {}
        },
        dematTabData: {
            formFields: [],
            tableData: [],
            fieldsErrors: {}
        },
        nomineeTabData: {
            formFields: [],
            tableData: [],
            fieldsErrors: {}
        },
        segmentTabData: {
            formFields: [],
            tableData: [],
            fieldsErrors: {}
        }
    });

    console.log("check tabs data", dynamicData)
    const pageData: any = findPageData(menuItems, "rekyc");
    console.log("check page ", pageData);


    const handleSaveAndNext = () => {
        // Find the current tab index
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

        // If there's a next tab, go to it
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id);
        } else {
            // On last tab, submit the form
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        // console.log("Form data to submit:", formData);
        // // Here you would typically send the data to your API
        // alert("Form submitted successfully!");
    };

    // Example tab data - you can replace this with your JSON data
    const tabs: TabData[] = [
        {
            id: "personal",
            label: "Personal Information",
            content: <Personal
                formFields={dynamicData.personalTabData.formFields}
                tableData={dynamicData.personalTabData.tableData}
                fieldErrors={dynamicData.personalTabData.fieldsErrors}
                setFieldData={setDynamicData}

            />
        },
        {
            id: "nominee",
            label: "Nominee",
            content: <Nominee
                formFields={dynamicData.nomineeTabData.formFields}
                tableData={dynamicData.nomineeTabData.tableData}
                fieldErrors={dynamicData.nomineeTabData.fieldsErrors}


            />
        },
        {
            id: "bank",
            label: "Bank",
            content: <KycBank
                formFields={dynamicData.bankTabData.formFields}
                tableData={dynamicData.bankTabData.tableData}
                fieldErrors={dynamicData.bankTabData.fieldsErrors}
            />
        },
        {
            id: "demat",
            label: "Demat",
            content: <KycDemat
                formFields={dynamicData.dematTabData.formFields}
                tableData={dynamicData.dematTabData.tableData}
                fieldErrors={dynamicData.dematTabData.fieldsErrors}
            />
        },
        {
            id: "segment",
            label: "Segment",
            content: <Segment
                formFields={dynamicData.segmentTabData.formFields}
                tableData={dynamicData.segmentTabData.tableData}
                fieldErrors={dynamicData.segmentTabData.fieldsErrors}

            />
        }, {
            id: "rekyc",
            label: "ReKyc",
            content: <KycFinalPage />
        },


    ];

    console.log("check active tab", activeTab)

    const fetchFormData = async () => {
        if (!pageData?.[0]?.Entry) return;
        setIsLoading(true);
        try {
            const entry = pageData[0].Entry;
            const masterEntry = entry.MasterEntry;
            const sql = Object.keys(masterEntry?.sql || {}).length ? masterEntry.sql : "";

            // Construct J_Ui - handle 'Option' key specially
            const jUi = Object.entries(masterEntry.J_Ui)
                .map(([key, value]) => {
                    if (key === 'Option' && true) {
                        return `"${key}":"Master_Edit"`;
                    }
                    return `"${key}":"${value}"`;
                })
                .join(',');

            // Construct J_Api
            const jApi = Object.entries(masterEntry.J_Api)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            // Construct X_Filter with edit data if available
            let xFilter = '';
            Object.entries(masterEntry.X_Filter).forEach(([key, value]) => {
                xFilter += `<${key}>${value}</${key}>`;
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
            let formData = response?.data?.data?.rs0 || [];
            // If in view mode, set all FieldEnabledTag to "N"

            // Transform the API data into your state structure
            const transformedData = {
                personalTabData: {
                    formFields: [],
                    tableData: []
                },
                bankTabData: {
                    formFields: [],
                    tableData: []
                },
                dematTabData: {
                    formFields: [],
                    tableData: []
                },
                nomineeTabData: {
                    formFields: [],
                    tableData: []
                },
                segmentTabData: {
                    formFields: [],
                    tableData: []
                }
            };

            formData.forEach((tab: any) => {
                switch (tab.TabName) {
                    case "PersonalDetails":
                        transformedData.personalTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData
                        };
                        break;
                    case "BankDetails":
                        transformedData.bankTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData
                        };
                        break;
                    case "DematDetails":
                        transformedData.dematTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData
                        };
                        break;
                    case "NomineeDetails":
                        transformedData.nomineeTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData
                        };
                        break;
                    case "SegmentDetails":
                        transformedData.segmentTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData
                        };
                        break;
                }
            });

            setDynamicData(transformedData);

            // Initialize form values with any preset values
            const initialValues: Record<string, any> = {};
            formData.forEach((field: any) => {
                if (field.type === 'WDateBox' && field.wValue) {
                    initialValues[field.wKey] = moment(field.wValue).format('YYYYMMDD');
                }

            });
           
            console.log("initial vaues", initialValues);
        } catch (error) {
            console.error('Error fetching MasterEntry data:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFormData();
    }, [])


    return (
        <div className="p-4" style={{ fontFamily: fonts.content }}>
            <h1 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>KYC Verification</h1>
            {/* Tabs Navigation */}
            <div className="flex border-b" style={{ borderColor: colors.color3 }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() =>
                            setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === tab.id
                            ? `text-${colors.primary} border-b-2`
                            : `text-${colors.tabText} hover:text-${colors.primary}`
                            }`}
                        style={{
                            borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent',
                            backgroundColor: activeTab === tab.id ? colors.buttonBackground : 'transparent'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="text-end mt-2">
                <button
                    className="rounded-lg"
                    style={{
                        backgroundColor: colors.background,
                        padding: "10px"
                    }}
                    onClick={handleSaveAndNext}
                >
                    {activeTab === "rekyc" ? "Submit" : "Save & Next"}
                </button>
            </div>
            {isLoading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (

                <div className="mt-3">
                    {tabs.find(tab => tab.id === activeTab)?.content}
                </div>

            )}

        </div>

    );
}



// formData={formData.personal} updateFormData={(data) => updateFormData("personal", data)}
