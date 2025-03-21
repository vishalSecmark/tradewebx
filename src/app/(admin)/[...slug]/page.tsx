"use client";
import React from "react";
import Dashboard from "@/apppages/Dashboard";
import LogoutPage from "../(auth)/logout/page";
import DynamicReportComponent from "@/components/DynamicReportComponent";
import ChangePassword from "@/apppages/ChangePassword";
import ThemePage from "@/apppages/ThemePage";
import Downloads from "@/apppages/Downloads";

// Define static route components
const staticRoutes: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  logout: <LogoutPage />,
  changepassword: <ChangePassword />,
  theme: <ThemePage />,
  downloads: <Downloads />,
};

// Define the type for params explicitly
interface PageParams {
  slug: string[];
}

export default function DynamicPage({ params }: { params: any | Promise<any> }) {
  // Unwrap params using React.use() if it's a Promise
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const route = unwrappedParams.slug[0];
  const subRoute = unwrappedParams.slug[1];

  // Handle static routes
  if (staticRoutes[route]) {
    return staticRoutes[route];
  }

  // For dynamic routes, determine the actual componentName
  const componentName = subRoute || route;

  // Convert kebab-case to PascalCase if needed
  const formattedComponentName = componentName
    .split("-")
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return <DynamicReportComponent componentName={formattedComponentName} />;
}