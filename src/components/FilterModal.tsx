"use client";
import React from 'react';
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
                        {/* Sorting Section */}
                        {!isDownload && isSortingAllowed && sortableFields.length > 0 && (
                            <div className="mb-4 p-4 rounded" style={{ backgroundColor: colors.oddCardBackground }}>
                                <h3 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                                    Sort By
                                </h3>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <Select
                                            options={sortableFields}
                                            value={sortableFields.find(field => field.value === currentSort?.field)}
                                            onChange={(selected) => {
                                                if (selected && onSortChange) {
                                                    onSortChange({
                                                        field: selected.value,
                                                        direction: currentSort?.direction || 'asc'
                                                    });
                                                }
                                            }}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    backgroundColor: colors.textInputBackground,
                                                    borderColor: colors.textInputBorder,
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
                                    {currentSort?.field && (
                                        <button
                                            className="p-2 rounded border"
                                            onClick={() => onSortChange?.({
                                                field: currentSort.field,
                                                direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
                                            })}
                                            style={{
                                                backgroundColor: colors.textInputBackground,
                                                borderColor: colors.textInputBorder,
                                                color: colors.textInputText
                                            }}
                                        >
                                            {currentSort.direction === 'asc' ?
                                                <FaSortAmountUp size={20} /> :
                                                <FaSortAmountDown size={20} />
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Form Creator */}
                        <FormCreator
                            formData={filters || [[]]}
                            onFilterChange={onFilterChange}
                            initialValues={initialValues}
                        />

                        {/* Download Buttons */}
                        {isDownload && (
                            <div className="flex justify-around mt-4">
                                {['word', 'excel', 'pdf'].map((type) => (
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
                                onClick={() => {
                                    onApply();
                                    onClose();
                                }}
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