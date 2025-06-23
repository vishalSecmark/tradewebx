"use client";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useState } from "react";
import Personal from './components/personal';
import Nominee from "./components/nominee";
import KycDemat from "./components/demat";
import Segment from "./components/segment";
import KycBank from "./components/bank";
import { useAppSelector } from "@/redux/hooks";
import { selectAllMenuItems } from "@/redux/features/menuSlice";
import axios from "axios";
import { BASE_URL, PATH_URL } from "@/utils/constants";
import moment from "moment";
import { findPageData } from "@/utils/helper";
import Documents from "./components/documents";
import Loader from "@/components/Loader";

interface TabData {
    id: string;
    label: string;
    content: React.ReactNode;
}

export default function Kyc() {
    const { colors, fonts } = useTheme();
    const menuItems = useAppSelector(selectAllMenuItems);
    const pageData: any = findPageData(menuItems, "rekyc");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const savedTab = localStorage.getItem('ekyc_activeTab');
            if (savedTab) return savedTab;
        }
        return 'personal';
    });

    const [dynamicData, setDynamicData] = useState<any>(() => {
        // Try to load from localStorage first
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ekyc_dynamicData');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setLastUpdated(parsed._lastUpdated || null);
                    return parsed;
                } catch (e) {
                    // fallback to default if parse fails
                }
            }
        }
        return {
            personalTabData: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            bankTabData: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            dematTabData: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            nomineeTabData: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            segmentTabData: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            attachments: {
                formFields: [],
                tableData: [],
                fieldsErrors: {},
                Settings:{}
            },
            _lastUpdated: null
        };
    });

    // Persist dynamicData and activeTab to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ekyc_dynamicData', JSON.stringify(dynamicData));
            localStorage.setItem('ekyc_activeTab', activeTab);
        }
    }, [dynamicData, activeTab]);

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
            const formData = response?.data?.data?.rs0 || [];
         
            // Transform the API data into your state structure
            const transformedData = {
                personalTabData: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                bankTabData: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                dematTabData: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                nomineeTabData: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                segmentTabData: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                attachments: {
                    formFields: [],
                    tableData: [],
                    Settings:{}
                },
                _lastUpdated: new Date().toISOString()
            };

            formData.forEach((tab: any) => {
                switch (tab.TabName) {
                    case "PersonalDetails":
                        transformedData.personalTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                    case "BankDetails":
                        transformedData.bankTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                    case "DematDetails":
                        transformedData.dematTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                    case "NomineeDetails":
                        transformedData.nomineeTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                    case "SegmentDetails":
                        transformedData.segmentTabData = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                    case "Attachments":
                        transformedData.attachments = {
                            formFields: tab.Data,
                            tableData: tab.tableData,
                            Settings: tab.Settings,
                        };
                        break;
                }
            });

            setDynamicData(transformedData);
            setLastUpdated(transformedData._lastUpdated);

            // Initialize form values with any preset values
            const initialValues: Record<string, any> = {};
            formData.forEach((field: any) => {
                if (field.type === 'WDateBox' && field.wValue) {
                    initialValues[field.wKey] = moment(field.wValue).format('YYYYMMDD');
                }
            });
           
            console.log("initial values", initialValues);
        } catch (error) {
            console.error('Error fetching MasterEntry data:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Always fetch fresh data when component mounts
    useEffect(() => {
        fetchFormData();
    }, []);

    const handleSetActiveTab = (tabId: string) => {
        setActiveTab(tabId);
    };

    const handleRefresh = () => {
        fetchFormData();
    };

    const tabs: TabData[] = [
        {
            id: "personal",
            label: "Personal Information",
            content: <Personal
                formFields={dynamicData.personalTabData.formFields}
                tableData={dynamicData.personalTabData.tableData}
                fieldErrors={dynamicData.personalTabData.fieldsErrors}
                Settings={dynamicData.personalTabData.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        },
        {
            id: "nominee",
            label: "Nominee",
            content: <Nominee
                formFields={dynamicData.nomineeTabData.formFields}
                tableData={dynamicData.nomineeTabData.tableData}
                fieldErrors={dynamicData.nomineeTabData.fieldsErrors}
                Settings={dynamicData.nomineeTabData.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        },
        {
            id: "bank",
            label: "Bank",
            content: <KycBank
                formFields={dynamicData.bankTabData.formFields}
                tableData={dynamicData.bankTabData.tableData}
                fieldErrors={dynamicData.bankTabData.fieldsErrors}
                Settings={dynamicData.bankTabData.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        },
        {
            id: "demat",
            label: "Demat",
            content: <KycDemat
                formFields={dynamicData.dematTabData.formFields}
                tableData={dynamicData.dematTabData.tableData}
                fieldErrors={dynamicData.dematTabData.fieldsErrors}
                Settings={dynamicData.dematTabData.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        },
        {
            id: "segment",
            label: "Segment",
            content: <Segment
                formFields={dynamicData.segmentTabData.formFields}
                tableData={dynamicData.segmentTabData.tableData}
                fieldErrors={dynamicData.segmentTabData.fieldsErrors}
                Settings={dynamicData.segmentTabData.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        },
        {
            id: "attachments",
            label: "Documents",
            content: <Documents
                formFields={dynamicData.attachments?.formFields}
                tableData={dynamicData.attachments?.tableData}
                fieldErrors={dynamicData.attachments?.fieldsErrors}
                Settings={dynamicData.attachments?.Settings}
                setFieldData={setDynamicData}
                setActiveTab={setActiveTab}
            />
        }
    ];

    return (
        <div className="p-4" style={{ fontFamily: fonts.content }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: colors.text }}>KYC Verification</h1>
                <div className="flex items-center">
                    {lastUpdated && (
                        <span className="text-sm mr-4" style={{ color: colors.secondary }}>
                            Last updated: {new Date(lastUpdated).toLocaleString()}
                        </span>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 text-sm rounded flex items-center"
                        style={{
                            backgroundColor: colors.buttonBackground,
                            color: colors.buttonText
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>
            
            {/* Tabs Navigation */}
            <div className="flex border-b" style={{ borderColor: colors.color3 }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        // onClick={() => handleSetActiveTab(tab.id)}
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
            
            {isLoading ? (
                <div className="flex inset-0 flex items-center justify-center z-[200] h-[70vh]">
                    <Loader />
                </div>
            ) : (
                <div className="mt-3">
                    {tabs.find(tab => tab.id === activeTab)?.content}
                </div>
            )}
        </div>
    );
}