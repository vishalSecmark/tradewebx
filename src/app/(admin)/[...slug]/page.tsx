import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import { notFound } from 'next/navigation';
import Dashboard from "@/pages/Dashboard";
import LogoutPage from "../(auth)/logout/page";


export const metadata: Metadata = {
  title: "TradeWeb",
  description: "TradeWeb",
};

// Define your route mappings
const routeComponents: Record<string, React.ReactNode> = {
  'dashboard': (
    <Dashboard />
  ),
  'reports': (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
    </div>
  ),
  'logout': (
    <LogoutPage />
  ),
  // Add more routes as needed
};

export default function DynamicPage({ params }: { params: { slug: string[] } }) {
  // Get the first segment of the URL
  const route = params.slug[0];

  // Check if we have a component for this route
  if (!routeComponents[route]) {
    notFound();
  }

  return routeComponents[route];
}