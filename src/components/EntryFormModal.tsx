"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import moment from 'moment';
import { useTheme } from '@/context/ThemeContext';

interface EntryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageData: any;
}

interface FormField {
    Srno: number;
    type: string;
    label: string;
    wKey: string;
    FieldSize: string;
    FieldType: string;
    ValidationAPI: any;
    wQuery?: {
        Sql: string;
        J_Ui: any;
        X_Filter: string;
        X_Filter_Multiple?: any;
        J_Api: any;
    };
    wDropDownKey?: {
        key: string;
        value: string;
    };
    wValue?: string;
}

interface EntryFormProps {
    formData: FormField[];
}

const EntryForm: React.FC<EntryFormProps> = ({ formData }) => {
    const { colors } = useTheme();
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});
    const [loadingDropdowns, setLoadingDropdowns] = useState<Record<string, boolean>>({});

    const marginBottom = 'mb-1'
    const fetchDropdownOptions = async (field: FormField) => {
        if (!field.wQuery) return;

        try {
            setLoadingDropdowns(prev => ({ ...prev, [field.wKey]: true }));

            const jUi = Object.entries(field.wQuery.J_Ui)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            const jApi = Object.entries(field.wQuery.J_Api)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${field.wQuery.Sql || ''}</Sql>
                <X_Filter>${field.wQuery.X_Filter || ''}</X_Filter>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            const options = response.data.data.rs0.map((item: any) => ({
                label: item[field.wDropDownKey?.key || 'DisplayName'],
                value: item[field.wDropDownKey?.value || 'Value']
            }));

            setDropdownOptions(prev => ({ ...prev, [field.wKey]: options }));
        } catch (error) {
            console.error(`Error fetching options for ${field.wKey}:`, error);
        } finally {
            setLoadingDropdowns(prev => ({ ...prev, [field.wKey]: false }));
        }
    };

    useEffect(() => {
        formData.forEach(field => {
            if (field.type === 'WDropDownBox' && field.wQuery) {
                fetchDropdownOptions(field);
            }
            if (field.type === 'WDateBox' && field.wValue) {
                setFormValues(prev => ({
                    ...prev,
                    [field.wKey]: moment(field.wValue, 'YYYYMMDD').toDate()
                }));
            }
        });
    }, [formData]);

    const handleInputChange = (key: string, value: any) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const renderFormField = (field: FormField) => {
        switch (field.type) {
            case 'WDropDownBox':
                return (
                    <div key={field.Srno} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            {field.label}
                        </label>
                        <Select
                            options={dropdownOptions[field.wKey] || []}
                            value={dropdownOptions[field.wKey]?.find(
                                (opt: any) => opt.value === formValues[field.wKey]
                            )}
                            onChange={(selected) => handleInputChange(field.wKey, selected?.value)}
                            isLoading={loadingDropdowns[field.wKey]}
                            placeholder="Select..."
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

            case 'WDateBox':
                return (
                    <div key={field.Srno} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            {field.label}
                        </label>
                        <DatePicker
                            selected={formValues[field.wKey]}
                            onChange={(date: Date | null) => handleInputChange(field.wKey, date)}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-3 py-1 border rounded-md"
                            wrapperClassName="w-full"
                            placeholderText="Select Date"
                        />
                    </div>
                );

            case 'WTextBox':
                return (
                    <div key={field.Srno} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            {field.label}
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-1 border rounded-md"
                            style={{
                                borderColor: colors.textInputBorder,
                                backgroundColor: colors.textInputBackground,
                                color: colors.textInputText
                            }}
                            value={formValues[field.wKey] || ''}
                            onChange={(e) => handleInputChange(field.wKey, e.target.value)}
                            placeholder={field.label}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            {formData.map(renderFormField)}
        </div>
    );
};

const EntryFormModal: React.FC<EntryFormModalProps> = ({ isOpen, onClose, pageData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormField[]>([]);

    const fetchMasterEntryData = async () => {
        if (!pageData?.[0]?.Entry) return;

        setIsLoading(true);
        try {
            const entry = pageData[0].Entry;
            const masterEntry = entry.MasterEntry;

            // Construct J_Ui
            const jUi = Object.entries(masterEntry.J_Ui)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            // Construct J_Api
            const jApi = Object.entries(masterEntry.J_Api)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            // Construct X_Filter
            let xFilter = '';
            Object.entries(masterEntry.X_Filter).forEach(([key, value]) => {
                if (value === '##InstrumentType##' || value === '##IntRefNo##') {
                    xFilter += `<${key}></${key}>`;
                } else {
                    xFilter += `<${key}>${value}</${key}>`;
                }
            });

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${masterEntry.Sql || ''}</Sql>
                <X_Filter>${xFilter}</X_Filter>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

            console.log('Request XML:', xmlData);

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            console.log('MasterEntry API Response:', response.data);
            setFormData(response.data.data.rs0);
        } catch (error) {
            console.error('Error fetching MasterEntry data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMasterEntryData();
        }
    }, [isOpen, pageData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-[80vw] overflow-y-auto min-h-[75vh] max-h-[75vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Entry Form</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : (
                    <EntryForm formData={formData} />
                )}
            </div>
        </div>
    );
};

export default EntryFormModal;
