"use client";
import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";
import Personal from './components/personal';
import { useEkycFormContext } from "@/context/EkycFormContext";
import Nominee from "./components/nominee";
import KycDemat from "./components/demat";
import Segment from "./components/segment";
import KycFinalPage from "./components/rekyc";
import KycBank from "./components/bank";

interface TabData {
    id: string;
    label: string;
    content: React.ReactNode;
}

export default function Kyc() {
    const { colors, fonts } = useTheme();
    console.log("check color", colors)
    const [activeTab, setActiveTab] = useState<string>("personal");
    const { formData, updateFormData } = useEkycFormContext();


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
        console.log("Form data to submit:", formData);
        // Here you would typically send the data to your API
        alert("Form submitted successfully!");
    };

    // Example tab data - you can replace this with your JSON data
    const tabs: TabData[] = [
        {
            id: "personal",
            label: "Personal Information",
            content: <Personal
                formData={formData.personal} updateFormData={(data) => updateFormData("personal", data)}
            />
        },
        {
            id: "nominee",
            label: "Nominee",
            content: <Nominee/>
        },
        {
            id: "bank",
            label: "Bank",
            content: <KycBank/>
        },
        {
            id: "demat",
            label: "Demat",
            content: <KycDemat/>
        },
        {
            id: "segment",
            label: "Segment",
            content: <Segment/>
        }, {
            id: "rekyc",
            label: "ReKyc",
            content: <KycFinalPage/>
        },


    ];

    console.log("check active tab", activeTab)

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

            {/* Tab Content */}
            <div className="mt-3">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>

    );
}
