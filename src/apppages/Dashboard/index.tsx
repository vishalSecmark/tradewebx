"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import nextDynamic from 'next/dynamic';
import { ApexOptions } from "apexcharts";
import Link from 'next/link';
import { useTheme } from "@/context/ThemeContext";
import { ACTION_NAME, PATH_URL } from '@/utils/constants';
import { BASE_URL } from '@/utils/constants';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchLastTradingDate, fetchInitializeLogin } from '@/redux/features/common/commonSlice';
import Select from 'react-select';
import CommonCustomDropdown from '@/components/form/DropDown/CommonDropDown';

const ReactApexChart = nextDynamic(() => import("react-apexcharts"), { ssr: false });



function Card({ cardData, onRefresh, selectedClient, auth }: any) {
    const { colors } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!cardData.grids && !cardData.loading) {
        return (
            <div style={{ backgroundColor: colors.cardBackground }} className="p-6 rounded-lg shadow-md">
                <div className="text-center">
                    <p style={{ color: colors.text }} className="mb-4">Failed to load data</p>
                    <button
                        onClick={() => {
                            if (typeof onRefresh === 'function') {
                                onRefresh();
                            }
                        }}
                        style={{
                            backgroundColor: colors.buttonBackground,
                            color: colors.buttonText
                        }}
                        className="p-2 rounded-full hover:opacity-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // Helper function to generate proper link path for navigateTo values
    const getLinkPath = (navigateTo: string, queryParams?: Record<string, string>) => {
        if (!navigateTo) return "";

        // Format the component name to match the dynamic routing pattern
        // Convert PascalCase or regular text to kebab-case
        const formattedPath = navigateTo
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();

        // If query parameters are provided, add them to the URL
        if (queryParams) {
            const queryString = new URLSearchParams(queryParams).toString();
            return `/${formattedPath}?${queryString}`;
        }

        return `/${formattedPath}`;
    };

    const renderPieChart = (pieData: any) => {
        if (!pieData) return null;

        return pieData.map((chart: any, index: number) => {
            const pieItems = chart.gridItems.filter((item: any) =>
                item.label.showPie !== false
            );

            if (pieItems.length === 0) return null;

            // Find the total item (if it exists)
            const totalItem = chart.gridItems.find((item: any) =>
                item.label.text.toLowerCase() === 'total'
            );

            const pieOptions: ApexOptions = {
                chart: {
                    type: 'donut',
                    background: colors.cardBackground,
                },
                labels: pieItems.map((item: any) => item.label.text),
                colors: pieItems.map((item: any) => item.label.pieColor),
                legend: {
                    show: false // Hide the built-in legend
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '55%',
                        }
                    }
                },
                dataLabels: {
                    enabled: false
                },
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        }
                    }
                }]
            };

            const series = pieItems.map((item: any) => parseFloat(item.value.text) || 0);



            return (
                <div
                    key={index}
                    style={{ backgroundColor: colors.cardBackground }}
                    className="rounded-lg shadow-md mb-4"
                >
                    <div className="border-b p-4 flex justify-between items-center"
                        style={{ borderColor: colors.color3 }}>
                        <h3 className="text-lg font-bold" style={{ color: chart.color }}>
                            {chart.navigateTo ? (
                                <Link
                                    href={getLinkPath(chart.navigateTo, {
                                        clientCode: selectedClient?.value || '',
                                        userType: auth.userType || ''
                                    })}
                                    className="hover:underline flex items-center gap-2"
                                    style={{ color: colors.text }}
                                >
                                    {chart.name}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </Link>
                            ) : (
                                chart.name
                            )}
                        </h3>
                        {chart.navigateTo && (
                            <Link
                                href={getLinkPath(chart.navigateTo, {
                                    clientCode: selectedClient?.value || '',
                                    userType: auth.userType || ''
                                })}
                                style={{ color: colors.primary }}
                                className="text-sm hover:opacity-80"
                            >
                                View Details
                            </Link>
                        )}
                    </div>
                    <div className="p-4 flex">
                        <div className="w-1/2">
                            <ReactApexChart
                                options={pieOptions}
                                series={series}
                                type="donut"
                                height={200}
                            />
                        </div>
                        <div className="w-1/2 flex flex-col justify-center">
                            {/* Custom legend */}
                            <div className="space-y-2">
                                {pieItems.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div
                                                className="w-3 h-3 mr-2 rounded-full"
                                                style={{ backgroundColor: item.label.pieColor }}
                                            ></div>
                                            <span style={{ color: item.label.color || colors.text }}>
                                                {item.navigateTo ? (
                                                    <Link
                                                        href={getLinkPath(item.navigateTo, {
                                                            clientCode: selectedClient?.value || '',
                                                            userType: auth.userType || ''
                                                        })}
                                                        className="hover:underline"
                                                    >
                                                        {item.label.text}
                                                    </Link>
                                                ) : (
                                                    item.label.text
                                                )}
                                            </span>
                                        </div>
                                        <span style={{ color: item.value.color || colors.text }}>
                                            {item.navigateTo ? (
                                                <Link
                                                    href={getLinkPath(item.navigateTo, {
                                                        clientCode: selectedClient?.value || '',
                                                        userType: auth.userType || ''
                                                    })}
                                                    className="hover:underline"
                                                >
                                                    {item.value.text}
                                                </Link>
                                            ) : (
                                                item.value.text
                                            )}
                                        </span>
                                    </div>
                                ))}

                                {/* Show total if it exists */}
                                {totalItem && (
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: colors.color3 }}>
                                        <span style={{ color: totalItem.label.color || colors.text, fontWeight: 'bold' }}>
                                            {totalItem.label.text}
                                        </span>
                                        <span style={{ color: totalItem.value.color || colors.text, fontWeight: 'bold' }}>
                                            {totalItem.value.text}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div
            style={{ backgroundColor: colors.cardBackground }}
            className="rounded-lg shadow-md mb-4 overflow-hidden"
        >
            {cardData.name && (
                <div
                    className="p-4 flex justify-between items-center"
                    style={{
                        backgroundColor: colors.primary,
                        color: colors.buttonText
                    }}
                >
                    <h2 className="font-bold">
                        {cardData.navigateTo ? (
                            <Link
                                href={getLinkPath(cardData.navigateTo, {
                                    clientCode: selectedClient?.value || '',
                                    userType: auth.userType || ''
                                })}
                                className="hover:underline flex items-center gap-2"
                            >
                                {cardData.name}
                                <span className="text-sm ml-2">{cardData.slogan}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        ) : (
                            <>
                                {cardData.name}
                                <span className="text-sm ml-2">{cardData.slogan}</span>
                            </>
                        )}
                    </h2>
                </div>
            )}
            <div className="p-4">
                {renderPieChart(cardData.pieData)}

                {cardData.grids && (
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                        {cardData.grids.map((grid: any, index: number) => (
                            <div
                                key={index}
                                style={{ backgroundColor: colors.cardBackground }}
                                className="p-4 rounded-lg shadow"
                            >
                                <h3 className="font-bold mb-4" style={{ color: grid.color }}>
                                    {grid.navigateTo ? (
                                        <Link
                                            href={getLinkPath(grid.navigateTo, {
                                                clientCode: selectedClient?.value || '',
                                                userType: auth.userType || ''
                                            })}
                                            className="hover:underline flex items-center gap-2"
                                        >
                                            {grid.name}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                    ) : (
                                        grid.name
                                    )}
                                </h3>
                                <div className="space-y-2">
                                    {grid.gridItems.map((item: any, itemIndex: number) => {
                                        // Determine if this grid item should have navigation
                                        // Either from the grid itself or from the individual item
                                        const navigateTo = item.navigateTo || grid.navigateTo;

                                        return (
                                            <div key={itemIndex} className="flex justify-between items-center">
                                                <span style={{ color: item.label.color }}>
                                                    {navigateTo && item.navigateTo ? (
                                                        <Link
                                                            href={getLinkPath(item.navigateTo, {
                                                                clientCode: selectedClient?.value || '',
                                                                userType: auth.userType || ''
                                                            })}
                                                            className="hover:underline flex items-center gap-2"
                                                        >
                                                            {item.label.text}
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </Link>
                                                    ) : (
                                                        item.label.text
                                                    )}
                                                </span>
                                                <span style={{ color: item.value.color }}>
                                                    {navigateTo && item.navigateTo ? (
                                                        <Link
                                                            href={getLinkPath(item.navigateTo, {
                                                                clientCode: selectedClient?.value || '',
                                                                userType: auth.userType || ''
                                                            })}
                                                            className="hover:underline flex items-center gap-2"
                                                        >
                                                            {item.value.text}
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </Link>
                                                    ) : (
                                                        item.value.text
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Dashboard() {
    const { colors } = useTheme();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const dispatch = useAppDispatch();
    const lastTradingDate = useAppSelector(state => state.common.lastTradingDate);
    const companyLogo = useAppSelector(state => state.common.companyLogo);
    const [userDashData, setUserDashData] = useState([]);
    const auth = useAppSelector(state => state.auth);
    const [selectedClient, setSelectedClient] = useState<{ value: string; label: string } | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [dropdownChanged, setDropdownChanged] = useState(false);

    console.log(auth.userType, 'auth');

    console.log("user data", userDashData);
    const getUserDashboardData = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const authToken = document.cookie.split('auth_token=')[1] || '';

            // Try to get cached dropdown options first
            const cachedOptions = localStorage.getItem('userDashboardOptions');
            if (cachedOptions) {
                try {
                    const parsedOptions = JSON.parse(cachedOptions);
                    if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
                        setUserDashData(parsedOptions);

                        // Handle client selection with cached options
                        const savedClient = localStorage.getItem('selectedDashboardClient');
                        if (savedClient) {
                            try {
                                const parsedClient = JSON.parse(savedClient);
                                // Verify the saved client exists in the current options
                                const clientExists = parsedOptions.some(item => item.Value === parsedClient.value);
                                if (clientExists) {
                                    setSelectedClient(parsedClient);
                                } else {
                                    setSelectedClient({
                                        value: parsedOptions[0].Value,
                                        label: parsedOptions[0].DisplayName
                                    });
                                }
                            } catch (e) {
                                setSelectedClient({
                                    value: parsedOptions[0].Value,
                                    label: parsedOptions[0].DisplayName
                                });
                            }
                        } else {
                            setSelectedClient({
                                value: parsedOptions[0].Value,
                                label: parsedOptions[0].DisplayName
                            });
                        }

                        // Return early - no need to fetch options again
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing cached dropdown options:', e);
                    // Continue to fetch fresh data if parsing fails
                }
            }

            // Fetch fresh dropdown options if no cache or cache failed
            const xmlData1 = `
            <dsXml>
                <J_Ui>"ActionName":"Common","Option":"Search","RequestFrom":"W"</J_Ui>
                <Sql/>
                <X_Filter></X_Filter>
                <J_Api>"UserId":"${userId}","AccYear":24,"MyDbPrefix":"SVVS","MenuCode":7,"ModuleID":0,"MyDb":null,"DenyRights":null</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData1, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${authToken}`
                },
                timeout: 300000
            });

            const result = response?.data?.data?.rs0;

            if (result && Array.isArray(result) && result.length > 0) {
                console.log(result, 'userDashData');
                setUserDashData(result);

                // Cache the dropdown options
                localStorage.setItem('userDashboardOptions', JSON.stringify(result));

                // Check for saved client in localStorage
                const savedClient = localStorage.getItem('selectedDashboardClient');
                if (savedClient) {
                    try {
                        const parsedClient = JSON.parse(savedClient);
                        // Verify the saved client exists in the current options
                        const clientExists = result.some(item => item.Value === parsedClient.value);
                        if (clientExists) {
                            setSelectedClient(parsedClient);
                        } else {
                            // If saved client no longer exists, use the first one
                            setSelectedClient({
                                value: result[0].Value,
                                label: result[0].DisplayName
                            });
                        }
                    } catch (e) {
                        // If parsing fails, use the first client
                        setSelectedClient({
                            value: result[0].Value,
                            label: result[0].DisplayName
                        });
                    }
                } else {
                    // If no saved client, use the first one
                    setSelectedClient({
                        value: result[0].Value,
                        label: result[0].DisplayName
                    });
                }
            } else {
                console.warn('No dashboard data received or data format incorrect');
                setUserDashData([]); // fallback empty array
                setSelectedClient(null);
            }

        } catch (error) {
            console.error('Error fetching user dashboard data:', error);
            setUserDashData([]); // fallback in case of error
            setSelectedClient(null);
        }
    };

    const getDashboardData = async () => {
        // Only show loader if data isn't already loaded or dropdown was changed
        if (isInitialLoad || dropdownChanged) {
            setLoading(true);
        }

        setError(false);
        try {
            const xmlData = `<dsXml>
                <J_Ui>"ActionName":"${ACTION_NAME}", "Option":"DASHBOARD_F","Level":1, "RequestFrom":"W"</J_Ui>
                <Sql></Sql>
                <X_Filter>
                    ${selectedClient ? `<ClientCode>${selectedClient.value}</ClientCode>` : ''}
                </X_Filter>
                <X_GFilter></X_GFilter>
                <J_Api>"UserId":"${localStorage.getItem('userId')}", "UserType":"${localStorage.getItem('userType')}"</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                },
                timeout: 300000
            });
            console.log(response.data.data.rs0, 'response.data.data.rs0');
            const newData = response.data.data.rs0 || [];
            setDashboardData(newData);

            // Store the data in localStorage
            if (selectedClient) {
                localStorage.setItem(`dashboardData_${selectedClient.value}`, JSON.stringify(newData));
            }

            // Reset flags
            setIsInitialLoad(false);
            setDropdownChanged(false);
            setError(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(true);
            setDashboardData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth.userType === 'branch') {
            getUserDashboardData();
        } else {
            // For non-branch users, set initial load to true and get data
            setIsInitialLoad(true);
            getDashboardData();
        }

        if (!lastTradingDate) {
            dispatch(fetchLastTradingDate());
        }
        if (!companyLogo) {
            dispatch(fetchInitializeLogin());
        }
    }, [dispatch, lastTradingDate, companyLogo]);

    // Save selected client to localStorage whenever it changes
    useEffect(() => {
        if (selectedClient) {
            localStorage.setItem('selectedDashboardClient', JSON.stringify(selectedClient));
        }
    }, [selectedClient]);

    // Handle client selection changes and load data accordingly
    useEffect(() => {
        if (selectedClient && auth.userType === 'branch') {
            // Check if we have persisted data for this client
            const persistedDataKey = `dashboardData_${selectedClient.value}`;
            const savedData = localStorage.getItem(persistedDataKey);

            if (savedData && !dropdownChanged && !isInitialLoad) {
                // Use persisted data if available and dropdown wasn't changed
                try {
                    const parsedData = JSON.parse(savedData);
                    setDashboardData(parsedData);
                    setLoading(false);
                } catch (e) {
                    console.error('Error parsing persisted data:', e);
                    // If parsing fails, fetch fresh data
                    getDashboardData();
                }
            } else {
                // Otherwise fetch fresh data
                getDashboardData();
            }
        }
    }, [selectedClient]);

    // Handler for dropdown change
    const handleClientChange = (value) => {
        if (value?.value !== selectedClient?.value) {
            setDropdownChanged(true);
            setSelectedClient(value);
        }
    };

    // Create a dedicated refresh function that can be passed to Card components
    const handleRefresh = useCallback(() => {
        // Clear persisted data for the current client
        if (selectedClient) {
            localStorage.removeItem(`dashboardData_${selectedClient.value}`);
        }

        // Force new data fetch with loader
        setIsInitialLoad(true);
        setDropdownChanged(true);
        setError(false);
        getDashboardData();
    }, [selectedClient]);

    if (loading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={{ backgroundColor: colors?.background2 || '#f0f0f0' }}
            >
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2"
                        style={{ borderColor: colors.primary }}
                    ></div>
                    <p style={{ color: colors.text }} className="mt-4">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={{ backgroundColor: colors?.background2 || '#f0f0f0' }}
            >
                <div className="text-center">
                    <p style={{ color: colors.text }} className="mb-4">
                        Failed to load dashboard data
                    </p>
                    <button
                        onClick={handleRefresh}
                        style={{
                            backgroundColor: colors.buttonBackground,
                            color: colors.buttonText
                        }}
                        className="p-2 rounded-full hover:opacity-90"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="container mx-auto p-4"
            style={{ backgroundColor: colors?.background2 || '#f0f0f0' }}
        >
            {auth.userType === 'branch' && (
                <div className="mb-4">
                    <CommonCustomDropdown
                        options={userDashData.map(item => ({
                            value: item.Value,
                            label: item.DisplayName
                        }))}
                        value={selectedClient}
                        onChange={handleClientChange}
                        placeholder="Select client..."
                        resetOnOpen={false}
                        colors={{
                            text: colors.text,
                            primary: colors.primary,
                            buttonText: colors.buttonText,
                            color3: colors.color3,
                            cardBackground: colors.cardBackground,
                        }}
                    />
                </div>
            )}

            <div className="space-y-4">
                {dashboardData && dashboardData.map((cardData: any, index: number) => (
                    <Card
                        key={index}
                        cardData={{
                            ...cardData,
                            onRefresh: handleRefresh,
                            loading: loading
                        }}
                        onRefresh={handleRefresh}
                        selectedClient={selectedClient}
                        auth={auth}
                    />
                ))}
            </div>
        </div>
    );
}

export default Dashboard;