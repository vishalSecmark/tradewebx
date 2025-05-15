"use client";
import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";

interface TabData {
    id: string;
    label: string;
    content: React.ReactNode;
}

export default function KycPage() {
    const { colors, fonts } = useTheme();
    const [activeTab, setActiveTab] = useState<string>("personal");

    // Example tab data - you can replace this with your JSON data
    const tabs: TabData[] = [
        {
            id: "personal",
            label: "Personal Information",
            content: <div>Personal Information Content</div>
        },
        {
            id: "documents",
            label: "Documents",
            content: <div>Documents Content</div>
        },
        {
            id: "verification",
            label: "Verification",
            content: <div>Verification Content</div>
        }
    ];

    return (
        <div className="p-4" style={{ fontFamily: fonts.content }}>
            <h1 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>KYC Verification</h1>

            {/* Tabs Navigation */}
            <div className="flex border-b" style={{ borderColor: colors.color3 }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === tab.id
                            ? `text-${colors.primary} border-b-2`
                            : `text-${colors.tabText} hover:text-${colors.primary}`
                            }`}
                        style={{
                            borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent',
                            backgroundColor: activeTab === tab.id ? colors.tabBackground : 'transparent'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    );
}
