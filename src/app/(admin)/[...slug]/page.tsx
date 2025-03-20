import type { Metadata } from "next";
import { notFound } from 'next/navigation';
import Dashboard from "@/pages/Dashboard";
import LogoutPage from "../(auth)/logout/page";
import DynamicReportComponent from "@/components/DynamicReportComponent";
import ChangePassword from "@/pages/ChangePassword";
import ThemePage from "@/pages/ThemePage";

export const metadata: Metadata = {
  title: "TradeWeb",
  description: "TradeWeb",
};

// Define static route components
const staticRoutes: Record<string, React.ReactNode> = {
  'dashboard': <Dashboard />,
  'logout': <LogoutPage />,
  'changepassword': <ChangePassword />,
  'theme': <ThemePage />,
};

export default function DynamicPage({ params }: { params: { slug: string[] } }) {
  const route = params.slug[0];
  const subRoute = params.slug[1];

  // Handle static routes
  if (staticRoutes[route]) {
    return staticRoutes[route];
  }

  // For dynamic routes, we need to determine the actual componentName
  // This might come from the last segment of the URL
  const componentName = subRoute || route;

  // Convert kebab-case to PascalCase if needed
  const formattedComponentName = componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return <DynamicReportComponent componentName={formattedComponentName} />;
}