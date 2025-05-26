"use client";
import React, { useState } from 'react';
import {DataGrid} from 'react-data-grid';
import Select from 'react-select';
import { useTheme } from "@/context/ThemeContext";
import { useEkycFormContext } from "@/context/EkycFormContext";

interface BankFormData {
  ifsc: string;
  accountNumber: string;
  accountType: { value: string; label: string };
  isDefault: boolean;
}

const KycBank = () => {
  const { colors, fonts } = useTheme();
  const { formData, updateFormData } = useEkycFormContext();
  const [openAddBank, setOpenAddBank] = useState(false);
  const [bankFormData, setBankFormData] = useState<BankFormData>({
    ifsc: '',
    accountNumber: '',
    accountType: { value: '', label: '' },
    isDefault: false,
  });

  const accountTypeOptions = [
    { value: 'savings', label: 'Savings' },
    { value: 'current', label: 'Current' },
    { value: 'joint', label: 'Joint' },
    { value: 'nre', label: 'NRE' },
    { value: 'nro', label: 'NRO' },
  ];

  const columns = [
    { key: 'mcr', name: 'MCR', sortable: true },
    { key: 'ifsc', name: 'IFSC Code', sortable: true },
    { key: 'accountNumber', name: 'Account Number', sortable: true },
    { key: 'bankName', name: 'Bank Name', sortable: true },
    { key: 'accountType', name: 'Account Type', sortable: true },
    { 
      key: 'isDefault', 
      name: 'Default Account', 
      renderCell: ({ row }: any) => (
        <input 
          type="checkbox" 
          checked={row.isDefault} 
          onChange={(e) => handleDefaultAccountChange(row.id, e.target.checked)}
          className="h-4 w-4"
        />
      )
    },
  ];

  const handleDefaultAccountChange = (id: string, checked: boolean) => {
    // If setting as default, first unset any existing default
    const updatedBanks = formData.bankDetails.map((bank: any) => {
      if (checked && bank.isDefault) {
        return { ...bank, isDefault: false };
      }
      return bank.id === id ? { ...bank, isDefault: checked } : bank;
    });
    updateFormData("bankDetails", updatedBanks);
  };

  const handleModify = (row: any) => {
    setBankFormData({
      ifsc: row.ifsc,
      accountNumber: row.accountNumber,
      accountType: { value: row.accountType.toLowerCase(), label: row.accountType },
      isDefault: row.isDefault,
    });
    setOpenAddBank(true);
  };

  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setBankFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAccountTypeChange = (selectedOption: any) => {
    setBankFormData(prev => ({
      ...prev,
      accountType: selectedOption
    }));
  };

  const handleSaveBank = () => {
    const newBank = {
      id: `bank-${Date.now()}`,
      mcr: generateMCR(), // You'll need to implement this or get from API
      ifsc: bankFormData.ifsc,
      accountNumber: bankFormData.accountNumber,
      bankName: 'Primary', // You may need to adjust this based on your logic
      accountType: bankFormData.accountType.label,
      isDefault: bankFormData.isDefault,
    };

    // If setting as default, first unset any existing default
    let updatedBanks = [...(formData.bankDetails || [])];
    if (bankFormData.isDefault) {
      updatedBanks = updatedBanks.map(bank => ({ ...bank, isDefault: false }));
    }
    updatedBanks.push(newBank);
    
    updateFormData("bankDetails", updatedBanks);
    setOpenAddBank(false);
    resetForm();
  };

  const generateMCR = () => {
    // This is a placeholder - implement your MCR generation logic
    return `MCR${Math.floor(Math.random() * 10000)}`;
  };

  const resetForm = () => {
    setBankFormData({
      ifsc: '',
      accountNumber: '',
      accountType: { value: '', label: '' },
      isDefault: false,
    });
  };

  return (
    <div>
      <DataGrid
        columns={columns}
        rows={formData.bankDetails || []}
        className="rdg-light"
        rowHeight={40}
        headerRowHeight={40}
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fonts.content,
          height: '500px',
        }}
      />
      
      <button 
        onClick={() => setOpenAddBank(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Bank Details
      </button>

      {/* Add Bank Modal */}
      {openAddBank && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-semibold mb-4">Add Bank Details</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">IFSC Code</label>
                <input
                  type="text"
                  name="ifsc"
                  value={bankFormData.ifsc}
                  onChange={handleBankFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankFormData.accountNumber}
                  onChange={handleBankFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Account Type</label>
                <Select
                  options={accountTypeOptions}
                  value={bankFormData.accountType}
                  onChange={handleAccountTypeChange}
                  className="basic-single"
                  classNamePrefix="select"
                  required
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={bankFormData.isDefault}
                  onChange={handleBankFormChange}
                  className="mr-2 h-4 w-4"
                />
                <label className="text-sm font-medium">Default Account</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setOpenAddBank(false);
                  resetForm();
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBank}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycBank;