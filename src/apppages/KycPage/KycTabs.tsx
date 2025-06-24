"use client";
import React from "react";
import { FaUser, FaUsers, FaUniversity, FaCreditCard, FaChartPie, FaFileAlt } from "react-icons/fa";
import Personal from "./components/personal";
import Nominee from "./components/nominee";
import KycBank from "./components/bank";
import KycDemat from "./components/demat";
import Segment from "./components/segment";
import Documents from "./components/documents";

export interface TabData {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const buildTabs = (dynamicData: any, setDynamicData: any, setActiveTab: any): TabData[] => [
  {
    id: "personal",
    label: "Personal Information",
    icon: <FaUser className="w-4 h-4" />,
    content: <Personal {...dynamicData.personalTabData} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  },
  {
    id: "nominee",
    label: "Nominee",
    icon: <FaUsers className="w-4 h-4" />,
    content: <Nominee {...dynamicData.nomineeTabData} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  },
  {
    id: "bank",
    label: "Bank",
    icon: <FaUniversity className="w-4 h-4" />,
    content: <KycBank {...dynamicData.bankTabData} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  },
  {
    id: "demat",
    label: "Demat",
    icon: <FaCreditCard className="w-4 h-4" />,
    content: <KycDemat {...dynamicData.dematTabData} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  },
  {
    id: "segment",
    label: "Segment",
    icon: <FaChartPie className="w-4 h-4" />,
    content: <Segment {...dynamicData.segmentTabData} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  },
  {
    id: "attachments",
    label: "Documents",
    icon: <FaFileAlt className="w-4 h-4" />,
    content: <Documents {...dynamicData.attachments} setFieldData={setDynamicData} setActiveTab={setActiveTab} />
  }
];