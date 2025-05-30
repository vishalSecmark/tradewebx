"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    useEffect(() => {
        console.log("Table data received in modal:", localData, selectedRows);
        setLocalData(tableData || []);
    }, [tableData]);

    const handleInputChange = (rowIndex: number, key: string, value: any) => {
        const updated = [...localData];
        updated[rowIndex] = { ...updated[rowIndex], [key]: value };
        setLocalData(updated);
    };

    const toggleRowSelection = (rowIndex: number) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(rowIndex)) {
            newSet.delete(rowIndex);
        } else {
            newSet.add(rowIndex);
        }
        setSelectedRows(newSet);
    };

    const handleSave = () => {
        const selectedData = localData.filter((_, idx) => selectedRows.has(idx));
        console.log("Selected edited data:", selectedData);
        onClose(); // optionally send selectedData to parent
    };

    const getEditableColumn = (key: string) => {
        return editableColumns.find((col) => col.wKey === key);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6">
                    <Dialog.Title className="text-lg font-semibold mb-4">{title}</Dialog.Title>

                    {localData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto border text-sm">
                                <thead>
                                    <tr>
                                        <th className="border px-2 py-1">Select</th>
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
                                            <td className="border px-2 py-1 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.has(rowIndex)}
                                                    onChange={() => toggleRowSelection(rowIndex)}
                                                />
                                            </td>
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
