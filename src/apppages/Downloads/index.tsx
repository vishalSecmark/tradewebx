"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSelector } from 'react-redux';
import axios from 'axios';
import moment from 'moment';
import DataTable from '@/components/DataTable';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import { RootState } from '@/redux/store';
import FilterModal from '@/components/FilterModal';

const Downloads = () => {
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [filterValues, setFilterValues] = useState({
        fromDate: moment().subtract(1, 'month').format('YYYY-MM-DD'),
        toDate: moment().format('YYYY-MM-DD'),
        segment: 'Equity/Derivative'
    });
    const [headings, setHeadings] = useState([]);

    const { colors } = useTheme();
    const userData = useSelector((state: RootState) => state.auth);
    console.log('userData', userData);
    const getDownloads = async (isReload = false) => {
        if (isReload) {
            setLoading(true);
        }

        const fromDateStr = moment(filterValues.fromDate).format('YYYYMMDD');
        const toDateStr = moment(filterValues.toDate).format('YYYYMMDD');

        const xmlData = `<dsXml>
            <J_Ui>"ActionName":"TradeWeb", "Option":"Download","Level":1, "RequestFrom":"M"</J_Ui>
            <Sql></Sql>
            <X_Filter>
                <FromDate>${fromDateStr}</FromDate>
                <ToDate>${toDateStr}</ToDate>
                <RepType></RepType>
                <DocumentType>Digital Ledger</DocumentType>
                <DocumentNo></DocumentNo>
                <Segment>${filterValues.segment}</Segment>
            </X_Filter>
            <X_GFilter></X_GFilter>
            <J_Api>"UserId":"${userData.userId}", "UserType":"${userData.userType}"</J_Api>
        </dsXml>`;

        try {
            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            if (response.data?.data?.rs0) {
                setDownloads(response.data.data.rs0);
            }

            // Parse headings from RS1 if available
            if (response.data.data.rs1?.[0]?.Settings) {
                const xmlString = response.data.data.rs1[0].Settings;
                const headingsRegex = /<Heading>([^<]*)<\/Heading>/g;
                const extractedHeadings = [];
                let match;
                while ((match = headingsRegex.exec(xmlString)) !== null) {
                    extractedHeadings.push(match[1]);
                }
                setHeadings(extractedHeadings);
            }
        } catch (error) {
            console.error('Error fetching downloads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getDownloads();
    }, []);

    const handleDownload = async (record) => {
        const fromDateStr = moment(filterValues.fromDate).format('YYYYMMDD');
        const toDateStr = moment(filterValues.toDate).format('YYYYMMDD');

        const xmlData = `<dsXml>
            <J_Ui>"ActionName":"TradeWeb", "Option":"Download","Level":1, "RequestFrom":"M"</J_Ui>
            <Sql></Sql>
            <X_Filter>
                <FromDate>${fromDateStr}</FromDate>
                <ToDate>${toDateStr}</ToDate>
                <RepType></RepType>
                <DocumentType></DocumentType>
                <DocumentNo>${record['Document No']}</DocumentNo>
            </X_Filter>
            <X_GFilter></X_GFilter>
            <J_Api>"UserId":"${userData.userId}", "UserType":"${userData.userType}"</J_Api>
        </dsXml>`;

        try {
            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            const fileData = response.data.data.rs0[0];
            if (fileData?.Base64) {
                const base64Data = fileData.Base64;
                const fileName = fileData.FileName.split('\\').pop();

                // Create and download file
                const link = document.createElement('a');
                link.href = `data:application/octet-stream;base64,${base64Data}`;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error downloading document:', error);
        }
    };

    const handleFilterChange = (values) => {
        console.log('values', values);
        handleApplyFilters();
        setFilterValues(values);

    };

    const handleApplyFilters = () => {
        getDownloads();
    };

    // Define filter fields for the FilterModal
    const filterFields = [
        [
            {
                type: 'WDateBox',
                label: 'From Date',
                wKey: 'fromDate',
                value: filterValues.fromDate
            },
            {
                type: 'WDateBox',
                label: 'To Date',
                wKey: 'toDate',
                value: filterValues.toDate
            }
        ],
        [
            {
                type: 'WDropDownBox',
                label: 'Segment',
                wKey: 'segment',
                value: filterValues.segment,
                options: [
                    { label: 'Equity/Derivative', value: 'Equity/Derivative' },
                    { label: 'Commodity', value: 'Commodity' }
                ]
            }
        ]
    ];

    return (
        <div className="p-4">
            {/* Headings Section */}
            {headings.length > 0 && (
                <div className="mb-4">
                    {headings.map((heading, index) => (
                        <div key={index} className="text-sm" style={{ color: colors.text }}>
                            {heading}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex justify-end gap-2 mb-4">
                <button
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => getDownloads(true)}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                </button>
                <button
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setFilterModalVisible(true)}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                data={downloads}
                onRowClick={handleDownload}
                settings={{
                    dateFormat: {
                        key: 'Document Date',
                        format: 'DD-MMM-YYYY'
                    }
                }}
            />

            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                title="Filter Downloads"
                filters={filterFields}
                onFilterChange={handleFilterChange}
                initialValues={filterValues}
                onApply={handleApplyFilters}
            />
        </div>
    );
};

export default Downloads;
