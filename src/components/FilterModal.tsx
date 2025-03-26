"use client";
import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import FormCreator from './FormCreator';
import Select from 'react-select';
import { FaSort, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    filters: any[];
    onFilterChange: (values: any) => void;
    initialValues: Record<string, any>;
    sortableFields?: Array<{ label: string; value: string }>;
    currentSort?: { field: string; direction: string };
    onSortChange?: (sortConfig: { field: string; direction: string }) => void;
    isSortingAllowed?: boolean;
    onApply: () => void;
    isDownload?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    title,
    filters,
    onFilterChange,
    initialValues,
    sortableFields = [],
    currentSort,
    onSortChange,
    isSortingAllowed = false,
    onApply,
    isDownload = false
}) => {
    const { colors } = useTheme();
    // Add local state to store filter values
    const [localFilterValues, setLocalFilterValues] = useState(initialValues);

    // Reset local values when modal opens with new initial values
    useEffect(() => {
        setLocalFilterValues(initialValues);
    }, [initialValues, isOpen]);

    // Handle local form changes
    const handleLocalFilterChange = (values: any) => {
        console.log('Local filter change in modal:', values);
        setLocalFilterValues(values);
    };

    // Handle apply button click
    const handleApply = () => {
        onFilterChange(localFilterValues); // Send final values to parent
        onClose(); // Close the modal
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="relative z-50"
        >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-xl w-full rounded-lg bg-white p-6"
                    style={{ backgroundColor: colors.filtersBackground }}>
                    <Dialog.Title className="text-lg font-medium mb-4" style={{ color: colors.text }}>
                        {title}
                    </Dialog.Title>

                    <div className="max-h-[70vh] overflow-y-auto">

                        {/* Form Creator */}
                        <FormCreator
                            formData={filters || [[]]}
                            onFilterChange={handleLocalFilterChange}
                            initialValues={localFilterValues}
                        />
                        <div className='h-30'></div>
                        {/* Download Buttons */}
                        {isDownload && (
                            <div className="flex justify-around mt-4">
                                {['CSV', 'PDF'].map((type) => (
                                    <button
                                        key={type}
                                        className="px-4 py-2 rounded flex flex-col items-center"
                                        style={{ backgroundColor: colors.buttonBackground }}
                                        onClick={() => {/* Handle download */ }}
                                    >
                                        <i className={`fa fa-file-${type}-o text-xl`} />
                                        <span className="mt-1" style={{ color: colors.buttonText }}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!isDownload && (
                        <div className="mt-4 flex justify-end">
                            <button
                                className="px-4 py-2 rounded"
                                style={{ backgroundColor: colors.buttonBackground }}
                                onClick={handleApply}
                            >
                                <span style={{ color: colors.buttonText }}>Apply</span>
                            </button>
                        </div>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default FilterModal; 