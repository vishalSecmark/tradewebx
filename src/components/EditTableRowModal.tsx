"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';

interface RowData {
    [key: string]: any;
}

interface EditableColumn {
    Srno: number;
    type: "WTextBox" | "WDropDownBox" | "WDateBox";
    label: string;
    wKey: string;
    showLabel: boolean;
    wPlaceholder?: string;
    options?: Array<{
        label: string;
        Value: string;
    }>;
    dependsOn?: {
        field: string | string[];
        wQuery: {
            J_Ui: any;
            Sql: string;
            X_Filter: string;
            X_Filter_Multiple?: string;
            J_Api: any;
        };
    };
    wDropDownKey?: {
        key: string;
        value: string;
    };
}

interface EditTableRowModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tableData: RowData[];
    editableColumns?: EditableColumn[];
}

const EditTableRowModal: React.FC<EditTableRowModalProps> = ({
    isOpen,
    onClose,
    title,
    tableData,
    editableColumns = [],
}) => {
    const [localData, setLocalData] = useState<RowData[]>([]);
    const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});
    const [loadingDropdowns, setLoadingDropdowns] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setLocalData(tableData || []);
    }, [tableData]);

    useEffect(() => {
        // Initialize dropdowns on component mount
        editableColumns.forEach(column => {
            if (column.type === 'WDropDownBox' && !column.options && column.dependsOn) {
                // These will be loaded when the parent field changes
            } else if (column.type === 'WDropDownBox' && !column.options) {
                // These need to be loaded immediately
                fetchDropdownOptions(column);
            }
        });
    }, [editableColumns]);

    const handleInputChange = (rowIndex: number, key: string, value: any) => {
        const updated = [...localData];
        updated[rowIndex] = { ...updated[rowIndex], [key]: value };
        setLocalData(updated);

        // Check if any dropdown depends on this field
        const dependentColumns = editableColumns.filter(column =>
            column.dependsOn &&
            (Array.isArray(column.dependsOn.field)
                ? column.dependsOn.field.includes(key)
                : column.dependsOn.field === key)
        );

        // Update dependent dropdowns
        if (dependentColumns.length > 0) {
            dependentColumns.forEach(column => {
                // For each row, fetch the dependent options
                updated.forEach((_, idx) => {
                    if (Array.isArray(column.dependsOn!.field)) {
                        const allFieldValues = column.dependsOn!.field.reduce((acc, field) => {
                            acc[field] = updated[idx][field];
                            return acc;
                        }, {} as Record<string, any>);

                        fetchDependentOptions(column, allFieldValues, idx);
                    } else {
                        fetchDependentOptions(column, updated[idx][key], idx);
                    }
                });
            });
        }
    };


    const handleSave = () => {
        console.log("Selected edited data:", localData);
        onClose(); // optionally send selectedData to parent
    };

    const getEditableColumn = (key: string) => {
        return editableColumns.find((col) => col.wKey === key);
    };

    const fetchDropdownOptions = async (column: EditableColumn) => {
        try {
            setLoadingDropdowns(prev => ({
                ...prev,
                [column.wKey]: true
            }));

            let jUi, jApi;

            if (typeof column.dependsOn?.wQuery?.J_Ui === 'object') {
                const uiObj = column.dependsOn.wQuery.J_Ui;
                jUi = Object.keys(uiObj)
                    .map(key => `"${key}":"${uiObj[key]}"`)
                    .join(',');
            } else {
                jUi = column.dependsOn?.wQuery?.J_Ui || '{}';
            }

            if (typeof column.dependsOn?.wQuery?.J_Api === 'object') {
                const apiObj = column.dependsOn.wQuery.J_Api;
                jApi = Object.keys(apiObj)
                    .map(key => `"${key}":"${apiObj[key]}"`)
                    .join(',');
            } else {
                jApi = column.dependsOn?.wQuery?.J_Api || '{}';
            }

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${column.dependsOn?.wQuery?.Sql || ''}</Sql>
                <X_Filter>${column.dependsOn?.wQuery?.X_Filter || ''}</X_Filter>
                <J_Api>${jApi},"UserType":"${localStorage.getItem('userType')}"</J_Api>
            </dsXml>`;

            console.log('Dropdown request XML:', xmlData);

            const response = await axios.post(
                BASE_URL + PATH_URL,
                xmlData,
                {
                    headers: {
                        'Content-Type': 'application/xml',
                        'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`
                    }
                }
            );

            const rs0Data = response.data?.data?.rs0;
            if (!Array.isArray(rs0Data)) {
                console.error('Unexpected data format:', response.data);
                setLoadingDropdowns(prev => ({
                    ...prev,
                    [column.wKey]: false
                }));
                return [];
            }

            const keyField = column.wDropDownKey?.key || 'DisplayName';
            const valueField = column.wDropDownKey?.value || 'Value';

            const options = rs0Data.map(dataItem => ({
                label: dataItem[keyField],
                value: dataItem[valueField]
            }));

            console.log(`Fetched ${options.length} options for ${column.wKey}:`, options);

            setDropdownOptions(prev => ({
                ...prev,
                [column.wKey]: options
            }));

            setLoadingDropdowns(prev => ({
                ...prev,
                [column.wKey]: false
            }));

            return options;
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            setLoadingDropdowns(prev => ({
                ...prev,
                [column.wKey]: false
            }));
            return [];
        }
    };

    const fetchDependentOptions = async (column: EditableColumn, parentValue: string | Record<string, any>, rowIndex: number) => {
        try {
            if (!column.dependsOn) return [];

            if (
                (typeof parentValue === 'string' && !parentValue) ||
                (typeof parentValue === 'object' && Object.values(parentValue).some(val => !val))
            ) {
                console.error(`Parent value for ${column.wKey} is empty or undefined`, parentValue);
                return [];
            }

            setLoadingDropdowns(prev => ({
                ...prev,
                [`${column.wKey}_${rowIndex}`]: true
            }));

            console.log(`Fetching dependent options for ${column.wKey} based on:`, parentValue);

            let jUi, jApi;

            if (typeof column.dependsOn.wQuery.J_Ui === 'object') {
                const uiObj = column.dependsOn.wQuery.J_Ui;
                jUi = Object.keys(uiObj)
                    .map(key => `"${key}":"${uiObj[key]}"`)
                    .join(',');
            } else {
                jUi = column.dependsOn.wQuery.J_Ui || '{}';
            }

            if (typeof column.dependsOn.wQuery.J_Api === 'object') {
                const apiObj = column.dependsOn.wQuery.J_Api;
                jApi = Object.keys(apiObj)
                    .map(key => `"${key}":"${apiObj[key]}"`)
                    .join(',');
            } else {
                jApi = column.dependsOn.wQuery.J_Api || '{}';
            }

            let xmlFilterContent = '';

            if (Array.isArray(column.dependsOn.field)) {
                if (column.dependsOn.wQuery.X_Filter_Multiple) {
                    xmlFilterContent = column.dependsOn.wQuery.X_Filter_Multiple;

                    column.dependsOn.field.forEach(field => {
                        const value = typeof parentValue === 'object' ? parentValue[field] : '';
                        xmlFilterContent = xmlFilterContent.replace(`\${${field}}`, value);
                    });
                } else {
                    xmlFilterContent = column.dependsOn.wQuery.X_Filter || '';
                    column.dependsOn.field.forEach(field => {
                        const value = typeof parentValue === 'object' ? parentValue[field] : '';
                        xmlFilterContent = xmlFilterContent.replace(`\${${field}}`, value);
                    });
                }
            } else {
                xmlFilterContent = column.dependsOn.wQuery.X_Filter || '';
                xmlFilterContent = xmlFilterContent.replace(
                    `\${${column.dependsOn.field}}`,
                    typeof parentValue === 'string' ? parentValue : ''
                );
            }

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${column.dependsOn.wQuery.Sql || ''}</Sql>
                ${Array.isArray(column.dependsOn.field) && column.dependsOn.wQuery.X_Filter_Multiple
                    ? `<X_Filter_Multiple>${xmlFilterContent}</X_Filter_Multiple><X_Filter></X_Filter>`
                    : `<X_Filter>${xmlFilterContent}</X_Filter>`
                }
                <J_Api>${jApi},"UserType":"${localStorage.getItem('userType')}"</J_Api>
            </dsXml>`;

            console.log('Dependent dropdown request XML:', xmlData);

            const response = await axios.post(
                BASE_URL + PATH_URL,
                xmlData,
                {
                    headers: {
                        'Content-Type': 'application/xml',
                        'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]?.split(';')[0]}`
                    }
                }
            );

            console.log('Dependent dropdown response:', response.data);

            const rs0Data = response.data?.data?.rs0;
            if (!Array.isArray(rs0Data)) {
                console.error('Unexpected data format:', response.data);
                setLoadingDropdowns(prev => ({
                    ...prev,
                    [`${column.wKey}_${rowIndex}`]: false
                }));
                return [];
            }

            const keyField = column.wDropDownKey?.key || 'DisplayName';
            const valueField = column.wDropDownKey?.value || 'Value';

            const options = rs0Data.map(dataItem => ({
                label: dataItem[keyField],
                value: dataItem[valueField]
            }));

            console.log(`Got ${options.length} options for ${column.wKey} at row ${rowIndex}:`, options);

            setDropdownOptions(prev => ({
                ...prev,
                [`${column.wKey}_${rowIndex}`]: options
            }));

            setLoadingDropdowns(prev => ({
                ...prev,
                [`${column.wKey}_${rowIndex}`]: false
            }));

            return options;
        } catch (error) {
            console.error('Error fetching dependent options:', error);
            setLoadingDropdowns(prev => ({
                ...prev,
                [`${column.wKey}_${rowIndex}`]: false
            }));
            return [];
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[80vh] flex flex-col">
                    <Dialog.Title className="text-lg font-semibold mb-4">{title}</Dialog.Title>

                    {localData.length > 0 ? (
                        <div className="overflow-auto flex-1">
                            <table className="min-w-full table-auto border text-sm">
                                <thead>
                                    <tr>
                                        {Object.keys(localData[0]).map((key) => (
                                            <th key={key} className="border px-2 py-1">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {localData.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {Object.entries(row).map(([key, value]) => {
                                                const editable = getEditableColumn(key);

                                                return (
                                                    <td key={key} className="border px-2 py-1">
                                                        {editable ? (
                                                            editable.type === "WTextBox" ? (
                                                                <input
                                                                    type="text"
                                                                    value={value ?? ""}
                                                                    onChange={(e) =>
                                                                        handleInputChange(rowIndex, key, e.target.value)
                                                                    }
                                                                    placeholder={editable.wPlaceholder}
                                                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                                                />
                                                            ) : editable.type === "WDropDownBox" ? (
                                                                <div>
                                                                    {editable.options ? (
                                                                        <select
                                                                            value={value ?? ""}
                                                                            onChange={(e) =>
                                                                                handleInputChange(rowIndex, key, e.target.value)
                                                                            }
                                                                            className="w-full border border-gray-300 rounded px-2 py-1"
                                                                        >
                                                                            <option value="">Select...</option>
                                                                            {editable.options?.map((opt) => (
                                                                                <option key={opt.Value} value={opt.Value}>
                                                                                    {opt.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : editable.dependsOn ? (
                                                                        <select
                                                                            value={value ?? ""}
                                                                            onChange={(e) =>
                                                                                handleInputChange(rowIndex, key, e.target.value)
                                                                            }
                                                                            className="w-full border border-gray-300 rounded px-2 py-1"
                                                                            disabled={loadingDropdowns[`${key}_${rowIndex}`]}
                                                                        >
                                                                            <option value="">
                                                                                {loadingDropdowns[`${key}_${rowIndex}`]
                                                                                    ? "Loading..."
                                                                                    : "Select..."}
                                                                            </option>
                                                                            {dropdownOptions[`${key}_${rowIndex}`]?.map((opt) => (
                                                                                <option key={opt.value} value={opt.value}>
                                                                                    {opt.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <select
                                                                            value={value ?? ""}
                                                                            onChange={(e) =>
                                                                                handleInputChange(rowIndex, key, e.target.value)
                                                                            }
                                                                            className="w-full border border-gray-300 rounded px-2 py-1"
                                                                            disabled={loadingDropdowns[key]}
                                                                        >
                                                                            <option value="">
                                                                                {loadingDropdowns[key]
                                                                                    ? "Loading..."
                                                                                    : "Select..."}
                                                                            </option>
                                                                            {dropdownOptions[key]?.map((opt) => (
                                                                                <option key={opt.value} value={opt.value}>
                                                                                    {opt.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            ) : editable.type === "WDateBox" ? (
                                                                <DatePicker
                                                                    selected={value ? new Date(value) : null}
                                                                    onChange={(date: Date | null) =>
                                                                        handleInputChange(rowIndex, key, date)
                                                                    }
                                                                    dateFormat="dd/MM/yyyy"
                                                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                                                />
                                                            ) : null
                                                        ) : (
                                                            <span>{value}</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600">No data available.</p>
                    )}

                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Save
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default EditTableRowModal;
