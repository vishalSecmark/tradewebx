"use client";
import React, { useEffect, useState, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import moment from 'moment';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import { useTheme } from '@/context/ThemeContext';

interface FormElement {
    type: string;
    label: string;
    wKey: string | string[];
    options?: Array<{ label: string; value: string }>;
    wQuery?: {
        J_Ui: any;
        Sql: string;
        X_Filter: string;
        J_Api: any;
    };
    dependsOn?: {
        field: string;
        wQuery: {
            J_Ui: any;
            Sql: string;
            X_Filter: string;
            J_Api: any;
        };
    };
    wDropDownKey?: {
        key: string;
        value: string;
    };
}

interface FormCreatorProps {
    formData: FormElement[][];
    onFilterChange: (values: any) => void;
    initialValues?: Record<string, any>;
}

const FormCreator: React.FC<FormCreatorProps> = ({
    formData,
    onFilterChange,
    initialValues = {}
}) => {
    const { colors } = useTheme();
    const [formValues, setFormValues] = useState(initialValues);
    const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});

    const handleFormChange = useCallback((newValues: any) => {
        if (JSON.stringify(newValues) !== JSON.stringify(formValues)) {
            onFilterChange(newValues);
        }
    }, [onFilterChange, formValues]);

    useEffect(() => {
        handleFormChange(formValues);
    }, [formValues, handleFormChange]);

    useEffect(() => {
        setFormValues(initialValues);
    }, [initialValues]);

    useEffect(() => {
        formData?.[0]?.forEach(item => {
            if (item.type === 'WDropDownBox' && !item.options && item.wQuery) {
                fetchDropdownOptions(item);
            }
        });
    }, []);

    useEffect(() => {
        const defaultValues = { ...initialValues };

        formData?.[0]?.forEach(item => {
            if (item.type === 'WDateRangeBox') {
                const [fromKey, toKey] = item.wKey as string[];
                if (!defaultValues[fromKey] && !defaultValues[toKey]) {
                    defaultValues[fromKey] = moment().subtract(3, 'months').toDate();
                    defaultValues[toKey] = moment().toDate();
                }
            }
        });

        if (Object.keys(defaultValues).length > Object.keys(initialValues).length) {
            setFormValues(defaultValues);
        }
    }, [formData, initialValues]);

    const fetchDropdownOptions = async (item: FormElement) => {
        try {
            const response = await axios.post(
                BASE_URL + PATH_URL,
                `<dsXml>
                    <J_Ui>${item.wQuery?.J_Ui}</J_Ui>
                    <Sql>${item.wQuery?.Sql}</Sql>
                    <X_Filter>${item.wQuery?.X_Filter}</X_Filter>
                    <J_Api>${item.wQuery?.J_Api}</J_Api>
                </dsXml>`,
                {
                    headers: {
                        'Content-Type': 'application/xml',
                    }
                }
            );

            const rs0Data = response.data?.data?.rs0;
            if (!Array.isArray(rs0Data)) {
                console.error('Unexpected data format:', response.data);
                return [];
            }

            const options = rs0Data.map(item => ({
                label: item.DisplayName,
                value: item.Value
            }));

            setDropdownOptions(prev => ({
                ...prev,
                [item.wKey as string]: options
            }));

            return options;
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            return [];
        }
    };

    const fetchDependentOptions = async (item: FormElement, parentValue: string) => {
        try {
            if (!item.dependsOn) return [];

            const xFilter = item.dependsOn.wQuery.X_Filter.replace('${value}', parentValue);
            const jUi = JSON.stringify(item.dependsOn.wQuery.J_Ui);
            const jApi = JSON.stringify(item.dependsOn.wQuery.J_Api);
            const cleanJUi = jUi.substring(1, jUi.length - 1);
            const cleanJApi = jApi.substring(1, jApi.length - 1);

            const response = await axios.post(
                BASE_URL + PATH_URL,
                `<dsXml>
                    <J_Ui>${cleanJUi}</J_Ui>
                    <Sql>${item.dependsOn.wQuery.Sql}</Sql>
                    <X_Filter>${xFilter}</X_Filter>
                    <J_Api>${cleanJApi}</J_Api>
                </dsXml>`,
                {
                    headers: {
                        'Content-Type': 'application/xml',
                    }
                }
            );

            const rs0Data = response.data?.data?.rs0;
            if (!Array.isArray(rs0Data)) {
                console.error('Unexpected data format:', response.data);
                return [];
            }

            const options = rs0Data.map(dataItem => ({
                label: dataItem[item.wDropDownKey?.key || 'DisplayName'],
                value: dataItem[item.wDropDownKey?.value || 'Value']
            }));

            setDropdownOptions(prev => ({
                ...prev,
                [item.wKey as string]: options
            }));

            return options;
        } catch (error) {
            console.error('Error fetching dependent options:', error);
            return [];
        }
    };

    const renderDateRangeBox = (item: FormElement) => {
        const [fromKey, toKey] = item.wKey as string[];

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    {item.label}
                </label>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <DatePicker
                            selected={formValues[fromKey]}
                            onChange={(date: Date) => setFormValues(prev => ({
                                ...prev,
                                [fromKey]: date
                            }))}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border rounded-md"
                            style={{
                                borderColor: colors.textInputBorder,
                                backgroundColor: colors.textInputBackground,
                                color: colors.textInputText
                            }}
                            placeholderText="From Date"
                        />
                    </div>
                    <div className="flex-1">
                        <DatePicker
                            selected={formValues[toKey]}
                            onChange={(date: Date) => setFormValues(prev => ({
                                ...prev,
                                [toKey]: date
                            }))}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-2 border rounded-md"
                            style={{
                                borderColor: colors.textInputBorder,
                                backgroundColor: colors.textInputBackground,
                                color: colors.textInputText
                            }}
                            placeholderText="To Date"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderTextBox = (item: FormElement) => {
        return (
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    {item.label}
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                        borderColor: colors.textInputBorder,
                        backgroundColor: colors.textInputBackground,
                        color: colors.textInputText
                    }}
                    value={formValues[item.wKey as string] || ''}
                    onChange={(e) => setFormValues(prev => ({
                        ...prev,
                        [item.wKey as string]: e.target.value
                    }))}
                    placeholder={item.label}
                />
            </div>
        );
    };

    const renderDateBox = (item: FormElement) => {
        return (
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    {item.label}
                </label>
                <DatePicker
                    selected={formValues[item.wKey as string]}
                    onChange={(date: Date) => setFormValues(prev => ({
                        ...prev,
                        [item.wKey as string]: date
                    }))}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-3 py-2 border rounded-md"
                    style={{
                        borderColor: colors.textInputBorder,
                        backgroundColor: colors.textInputBackground,
                        color: colors.textInputText
                    }}
                    placeholderText="Select Date"
                />
            </div>
        );
    };

    const renderDropDownBox = (item: FormElement) => {
        const options = item.options
            ? item.options
            : dropdownOptions[item.wKey as string] || [];

        return (
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    {item.label}
                </label>
                <Select
                    options={options}
                    value={options.find(opt => opt.value === formValues[item.wKey as string])}
                    onChange={(selectedOption) => {
                        if (selectedOption) {
                            setFormValues(prev => ({
                                ...prev,
                                [item.wKey as string]: selectedOption.value
                            }));

                            formData?.[0]?.forEach(dependentItem => {
                                if (dependentItem.dependsOn?.field === item.wKey) {
                                    fetchDependentOptions(dependentItem, selectedOption.value);
                                }
                            });
                        }
                    }}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                        control: (base) => ({
                            ...base,
                            borderColor: colors.textInputBorder,
                            backgroundColor: colors.textInputBackground,
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: colors.textInputText,
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? colors.primary : colors.textInputBackground,
                            color: state.isFocused ? colors.buttonText : colors.textInputText,
                        }),
                    }}
                />
            </div>
        );
    };

    const renderCheckBox = (item: FormElement) => {
        return (
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={formValues[item.wKey as string] || false}
                    onChange={(e) => setFormValues(prev => ({
                        ...prev,
                        [item.wKey as string]: e.target.checked
                    }))}
                    style={{
                        accentColor: colors.primary
                    }}
                />
                <label className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
                    {item.label}
                </label>
            </div>
        );
    };

    const renderFormElement = (item: FormElement) => {
        switch (item.type) {
            case 'WDateRangeBox':
                return renderDateRangeBox(item);
            case 'WTextBox':
                return renderTextBox(item);
            case 'WDateBox':
                return renderDateBox(item);
            case 'WDropDownBox':
                return renderDropDownBox(item);
            case 'WCheckBox':
                return renderCheckBox(item);
            default:
                return null;
        }
    };

    return (
        <div className="p-4" style={{ backgroundColor: colors.filtersBackground }}>
            {formData?.map((filterGroup, groupIndex) => (
                <div key={groupIndex} className="mb-4">
                    {filterGroup.map((item, itemIndex) => (
                        <div key={`${groupIndex}-${itemIndex}`}>
                            {renderFormElement(item)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default FormCreator; 