"use client";
import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { selectAllMenuItems } from '@/redux/features/menuSlice';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import moment from 'moment';
import FilterModal from './FilterModal';
import { FaSync, FaFilter } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';
import DataTable from './DataTable';

interface DynamicReportComponentProps {
    componentName: string;
}

const DynamicReportComponent: React.FC<DynamicReportComponentProps> = ({ componentName }) => {
    const menuItems = useAppSelector(selectAllMenuItems);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [apiData, setApiData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [primaryKeyFilters, setPrimaryKeyFilters] = useState<Record<string, any>>({});
    const [rs1Settings, setRs1Settings] = useState<any>(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ field: string; direction: string }>({
        field: '',
        direction: 'asc'
    });
    const [downloadFilters, setDownloadFilters] = useState<Record<string, any>>({});

    const { colors } = useTheme();

    const findPageData = () => {
        for (const item of menuItems) {
            if (item.componentName.toLowerCase() === componentName.toLowerCase() && item.pageData) {
                return item.pageData;
            }

            if (item.subItems) {
                for (const subItem of item.subItems) {
                    if (subItem.componentName.toLowerCase() === componentName.toLowerCase() && subItem.pageData) {
                        return subItem.pageData;
                    }
                }
            }
        }
        return null;
    };

    const pageData = findPageData();
    console.log('pageData', pageData);
    // Helper functions for parsing XML settings
    const parseXmlList = (xmlString: string, tag: string): string[] => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'g');
        const matches = xmlString.match(regex);
        return matches ? matches.map(match => match.replace(new RegExp(`</?${tag}>`, 'g'), '').split(',')) : [];
    };

    const parseXmlValue = (xmlString: string, tag: string): string => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`);
        const match = xmlString.match(regex);
        return match ? match[1] : '';
    };

    const parseHeadings = (xmlString: string): any => {
        // Implement heading parsing logic if needed
        return {};
    };

    const fetchData = async () => {
        if (!pageData) return;

        setIsLoading(true);
        try {
            let filterXml = '';

            // Handle filters
            Object.entries(filters).forEach(([key, value]) => {
                if (!value) return;

                if (value instanceof Date || moment.isMoment(value)) {
                    const formattedDate = moment(value).format('YYYYMMDD');
                    filterXml += `<${key}>${formattedDate}</${key}>`;
                    console.log(`Adding date filter: ${key}=${formattedDate}`);
                } else {
                    filterXml += `<${key}>${value}</${key}>`;
                    console.log(`Adding filter: ${key}=${value}`);
                }
            });

            // Add primary key filters for levels > 0
            if (currentLevel > 0) {
                Object.entries(primaryKeyFilters).forEach(([key, value]) => {
                    filterXml += `<${key}>${value}</${key}>`;
                });
            }

            const xmlData = `<dsXml>
                <J_Ui>${JSON.stringify(pageData[0].levels[currentLevel].J_Ui).slice(1, -1)}</J_Ui>
                <Sql>${pageData[0].Sql || ''}</Sql>
                <X_Filter>${filterXml}</X_Filter>
                <X_GFilter></X_GFilter>
                <J_Api>"UserId":"${localStorage.getItem('userId')}"</J_Api>
            </dsXml>`;

            console.log('Request XML:', xmlData);

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                },
                timeout: 50000
            });

            console.log('API Response:', response.data);
            setApiData(response.data.data.rs0);

            // Parse RS1 Settings if available
            if (response.data.data.rs1?.[0]?.Settings) {
                const xmlString = response.data.data.rs1[0].Settings;
                const settingsJson = {
                    totalList: parseXmlList(xmlString, 'TotalList'),
                    rightList: parseXmlList(xmlString, 'RightList'),
                    hideList: parseXmlList(xmlString, 'HideList'),
                    dateFormat: parseXmlValue(xmlString, 'DateFormat'),
                    dateFormatList: parseXmlList(xmlString, 'DateFormatList'),
                    dec2List: parseXmlList(xmlString, 'Dec2List'),
                    dec4List: parseXmlList(xmlString, 'Dec4List'),
                    drCRColorList: parseXmlList(xmlString, 'DrCRColorList'),
                    pnLColorList: parseXmlList(xmlString, 'PnLColorList'),
                    primaryKey: parseXmlValue(xmlString, 'PrimaryKey'),
                    companyName: parseXmlValue(xmlString, 'CompanyName'),
                    companyAdd1: parseXmlValue(xmlString, 'CompanyAdd1'),
                    companyAdd2: parseXmlValue(xmlString, 'CompanyAdd2'),
                    companyAdd3: parseXmlValue(xmlString, 'CompanyAdd3'),
                    reportHeader: parseXmlValue(xmlString, 'ReportHeader'),
                    pdfWidth: parseXmlValue(xmlString, 'PDFWidth'),
                    pdfHeight: parseXmlValue(xmlString, 'PDFHeight'),
                    mobileColumns: parseXmlList(xmlString, 'MobileColumns'),
                    tabletColumns: parseXmlList(xmlString, 'TabletColumns'),
                    webColumns: parseXmlList(xmlString, 'WebColumns'),
                    headings: parseHeadings(xmlString)
                };

                setRs1Settings(settingsJson);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.response?.data) {
                console.error('Error response data:', error.response.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle record click for level navigation
    const handleRecordClick = (record: any) => {
        if (currentLevel < (pageData?.[0].levels.length || 0) - 1) {
            // Set primary key filters based on the clicked record
            setPrimaryKeyFilters(prev => ({
                ...prev,
                // Add the necessary primary key values from the record
                // You'll need to adjust this based on your data structure
                PrimaryKey: record.id // or whatever your primary key field is
            }));
            setCurrentLevel(prev => prev + 1);
        }
    };

    // Add these functions
    const handleFilterChange = (newFilters: Record<string, any>) => {
        if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
            setFilters(newFilters);
        }
    };

    const handleDownloadFilterChange = (newFilters: Record<string, any>) => {
        if (JSON.stringify(downloadFilters) !== JSON.stringify(newFilters)) {
            setDownloadFilters(newFilters);
        }
    };

    // Modify the filter initialization useEffect
    useEffect(() => {
        if (pageData?.[0]?.filters) {
            const defaultFilters: Record<string, any> = {};

            // Handle the nested array structure
            pageData[0].filters.forEach(filterGroup => {
                filterGroup.forEach(filter => {
                    if (filter.type === 'WDateRangeBox') {
                        const [fromKey, toKey] = filter.wKey;

                        if (filter.wValue && filter.wValue.length === 2) {
                            // Use pre-selected values if provided
                            defaultFilters[fromKey] = moment(filter.wValue[0], 'YYYYMMDD').toDate();
                            defaultFilters[toKey] = moment(filter.wValue[1], 'YYYYMMDD').toDate();
                        } else {
                            // Fallback to financial year logic
                            const currentDate = moment();
                            let financialYearStart;

                            if (currentDate.month() < 3) {
                                financialYearStart = moment().subtract(1, 'year').month(3).date(1);
                            } else {
                                financialYearStart = moment().month(3).date(1);
                            }

                            defaultFilters[fromKey] = financialYearStart.toDate();
                            defaultFilters[toKey] = moment().toDate();
                        }
                    }
                });
            });

            console.log('Setting default filters:', defaultFilters);
            setFilters(defaultFilters);
        }
    }, [pageData]);

    // Initial data fetch
    useEffect(() => {
        if (pageData) {
            fetchData();
        }
    }, [currentLevel, pageData]);

    if (!pageData) {
        return <div>Loading report data...</div>;
    }

    return (
        <div className="">
            {/* Header Actions */}


            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filters"
                filters={pageData[0].filters || []}
                onFilterChange={handleFilterChange}
                initialValues={filters}
                sortableFields={apiData ? Object.keys(apiData[0] || {}).map(key => ({
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    value: key
                })) : []}
                currentSort={sortConfig}
                onSortChange={setSortConfig}
                isSortingAllowed={pageData[0].isShortAble !== "false"}
                onApply={fetchData}
            />

            {/* Download Modal */}
            <FilterModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                title="Download Options"
                filters={pageData[0].downloadFilters || []}
                onFilterChange={handleDownloadFilterChange}
                initialValues={downloadFilters}
                isDownload={true}
                onApply={() => { }}
            />

            {/* Tabs */}
            <div className="flex mb-4">
                <div className="flex flex-1">
                    {pageData[0].levels.map((level, index) => (
                        <button
                            key={index}
                            className={`px-4 py-2 mr-2 ${currentLevel === index ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            disabled={index > currentLevel}
                        >
                            {level.name}
                        </button>
                    ))}
                </div>
                <div>
                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            className="p-2 rounded"
                            onClick={() => fetchData()}
                            style={{ color: colors.text }}
                        >
                            <FaSync size={20} />
                        </button>
                        {pageData[0].filters && pageData[0].filters.length > 0 && (
                            <button
                                className="p-2 rounded"
                                onClick={() => setIsFilterModalOpen(true)}
                                style={{ color: colors.text }}
                            >
                                <FaFilter size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && <div>Loading...</div>}

            {/* Data Display */}
            {!isLoading && apiData && (
                <div className="space-y-4">
                    <DataTable
                        data={apiData}
                        settings={pageData[0].levels[currentLevel].settings}
                    />
                </div>
            )}
        </div>
    );
};

export default DynamicReportComponent; 