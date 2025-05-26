"use client";
import React, { useState } from 'react';
import {DataGrid }from 'react-data-grid';
import Select from 'react-select';
import { useTheme } from "@/context/ThemeContext";
import { useEkycFormContext } from "@/context/EkycFormContext";

interface DematFormData {
  depositary: { value: string; label: string };
  dpId: string;
  dematNumber: string;
  isDefault: boolean;
}

const KycDemat = () => {
  const { colors, fonts } = useTheme();
  const { formData, updateFormData } = useEkycFormContext();
  const [openAddDemat, setOpenAddDemat] = useState(false);
  const [dematFormData, setDematFormData] = useState<DematFormData>({
    depositary: { value: '', label: '' },
    dpId: '',
    dematNumber: '',
    isDefault: false,
  });

  const depositaryOptions = [
    { value: 'cdsl', label: 'CDSL' },
    { value: 'nsdl', label: 'NSDL' },
    // Add more depositaries as needed
  ];

  const columns = [
    { key: 'dematId', name: 'Demat ID', sortable: true },
    { key: 'dematNumber', name: 'Demat Number', sortable: true },
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
    }
  ];

  const handleDefaultAccountChange = (id: string, checked: boolean) => {
    // If setting as default, first unset any existing default
    const updatedDematAccounts = formData.dematAccounts.map((account: any) => {
      if (checked && account.isDefault) {
        return { ...account, isDefault: false };
      }
      return account.id === id ? { ...account, isDefault: checked } : account;
    });
    updateFormData("dematAccounts", updatedDematAccounts);
  };

  const handleDematFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setDematFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDepositaryChange = (selectedOption: any) => {
    setDematFormData(prev => ({
      ...prev,
      depositary: selectedOption
    }));
  };

  const handleSaveDemat = () => {
    const newDematAccount = {
      id: `demat-${Date.now()}`,
      dematId: generateDematId(), // You'll need to implement this or get from API
      depositary: dematFormData.depositary.label,
      dpId: dematFormData.dpId,
      dematNumber: dematFormData.dematNumber,
      isDefault: dematFormData.isDefault,
    };

    // If setting as default, first unset any existing default
    let updatedDematAccounts = [...(formData.dematAccounts || [])];
    if (dematFormData.isDefault) {
      updatedDematAccounts = updatedDematAccounts.map(account => ({ ...account, isDefault: false }));
    }
    updatedDematAccounts.push(newDematAccount);
    
    updateFormData("dematAccounts", updatedDematAccounts);
    setOpenAddDemat(false);
    resetForm();
  };

  const generateDematId = () => {
    // This is a placeholder - implement your Demat ID generation logic
    return `DEMAT${Math.floor(Math.random() * 10000)}`;
  };

  const resetForm = () => {
    setDematFormData({
      depositary: { value: '', label: '' },
      dpId: '',
      dematNumber: '',
      isDefault: false,
    });
  };

  return (
    <div>
      <DataGrid
        columns={columns}
        rows={formData.dematAccounts || []}
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
        onClick={() => setOpenAddDemat(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Demat
      </button>

      {/* Add Demat Modal */}
      {openAddDemat && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-semibold mb-4">Add Demat Account</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Depositary</label>
                <Select
                  options={depositaryOptions}
                  value={dematFormData.depositary}
                  onChange={handleDepositaryChange}
                  className="basic-single"
                  classNamePrefix="select"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">DP ID</label>
                <input
                  type="text"
                  name="dpId"
                  value={dematFormData.dpId}
                  onChange={handleDematFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Demat Number</label>
                <input
                  type="text"
                  name="dematNumber"
                  value={dematFormData.dematNumber}
                  onChange={handleDematFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={dematFormData.isDefault}
                  onChange={handleDematFormChange}
                  className="mr-2 h-4 w-4"
                />
                <label className="text-sm font-medium">Default Account</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setOpenAddDemat(false);
                  resetForm();
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDemat}
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

export default KycDemat;