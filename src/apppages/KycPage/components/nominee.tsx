"use client";
import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';
import Select from 'react-select';
import { useTheme } from "@/context/ThemeContext";
import { useEkycFormContext } from "@/context/EkycFormContext";

interface NomineeFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  address1: string;
  address2: string;
  address3: string;
  pincode: string;
  city: string;
  state: { value: string; label: string };
  country: string;
  dob: string;
  mobile: string;
  aadhar: string;
  pan: string;
  relation: { value: string; label: string };
  share: string;
  residualSecurity: boolean;
}

// Update the GuardianFormData interface
interface GuardianFormData {
  sameAsNomineeAddress: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: { value: string; label: string };
  pincode: string;
  mobile: string;
  pan: string;
  aadhar: string;
  email: string;
  dob: string;
  relationship: { value: string; label: string };
}


const Nominee = () => {
  const { colors, fonts } = useTheme();
  const { formData, updateFormData } = useEkycFormContext();
  const [openAddNominee, setOpenAddNominee] = useState(false);
  const [openGuardianForm, setOpenGuardianForm] = useState(false);
  const [openDocumentUpload, setOpenDocumentUpload] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState('');
  const [sameAsCorrespondence, setSameAsCorrespondence] = useState(false);

  const initialNomineeFormData: NomineeFormData = {
    firstName: '',
    middleName: '',
    lastName: '',
    address1: '',
    address2: '',
    address3: '',
    pincode: '',
    city: '',
    state: { value: '', label: '' },
    country: '',
    dob: '',
    mobile: '',
    aadhar: '',
    pan: '',
    relation: { value: '', label: '' },
    share: '',
    residualSecurity: false,
  };

  // Update the initial state
  const initialGuardianFormData: GuardianFormData = {
    sameAsNomineeAddress: false,
    firstName: '',
    middleName: '',
    lastName: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: { value: '', label: '' },
    pincode: '',
    mobile: '',
    pan: '',
    aadhar: '',
    email: '',
    dob: '',
    relationship: { value: '', label: '' },
  };


  // Add this handler
  const handleSameAsNomineeAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setGuardianFormData(prev => ({
      ...prev,
      sameAsNomineeAddress: checked,
      ...(checked && {
        address1: nomineeFormData.address1,
        address2: nomineeFormData.address2,
        address3: nomineeFormData.address3,
        city: nomineeFormData.city,
        state: nomineeFormData.state,
        pincode: nomineeFormData.pincode,
      })
    }));
  };

  const [nomineeFormData, setNomineeFormData] = useState<NomineeFormData>(initialNomineeFormData);
  const [guardianFormData, setGuardianFormData] = useState<GuardianFormData>(initialGuardianFormData);

  const stateOptions = [
    { value: 'MH', label: 'Maharashtra' },
    { value: 'DL', label: 'Delhi' },
    // Add more states as needed
  ];

  const relationOptions = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    // Add more relations as needed
  ];

  const columns = [
    { key: 'nomineeName', name: 'Nominee Name', sortable: true },
    { key: 'nomineeShare', name: 'Nominee Share (%)', sortable: true },
    { key: 'dob', name: 'DOB', sortable: true },
    { key: 'guardianName', name: 'Guardian Name', sortable: true },
    {
      key: 'residualSecurity',
      name: 'Residual Security',
      renderCell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.residualSecurity}
          onChange={(e) => handleCheckboxChange(row.id, e.target.checked)}
          className="h-4 w-4"
        />
      )
    },
    {
      key: 'actions',
      name: 'Action',
      renderCell: ({ row }: any) => (
        <button
          onClick={() => handleModify(row)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Modify
        </button>
      )
    },
  ];

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updatedNominees = formData.nominee.map((nominee: any) =>
      nominee.id === id ? { ...nominee, residualSecurity: checked } : nominee
    );
    updateFormData("nominee", updatedNominees);
  };

  const handleModify = (row: any) => {
    const nameParts = row.nomineeName.split(' ');
    setNomineeFormData({
      ...initialNomineeFormData,
      firstName: nameParts[0] || '',
      middleName: nameParts.length > 2 ? nameParts[1] : '',
      lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
      share: row.nomineeShare,
      dob: row.dob,
      residualSecurity: row.residualSecurity,
      // Add other fields from row data
    });
    setOpenAddNominee(true);
  };

  const handleNomineeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNomineeFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNomineeSelectChange = (name: string, selectedOption: any) => {
    setNomineeFormData(prev => ({
      ...prev,
      [name]: selectedOption
    }));
  };

  const handleGuardianFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setGuardianFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardianSelectChange = (name: string, selectedOption: any) => {
    setGuardianFormData(prev => ({
      ...prev,
      [name]: selectedOption
    }));
  };

  const handleSameAsNomineeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setGuardianFormData(prev => ({
      ...prev,
      sameAsNominee: checked,
      ...(checked && {
        firstName: nomineeFormData.firstName,
        middleName: nomineeFormData.middleName,
        lastName: nomineeFormData.lastName,
        address1: nomineeFormData.address1,
        address2: nomineeFormData.address2,
        address3: nomineeFormData.address3,
        city: nomineeFormData.city,
        state: nomineeFormData.state,
        pincode: nomineeFormData.pincode,
        mobile: nomineeFormData.mobile,
      })
    }));
  };

  const handleSaveNominee = () => {
    if (isMinor(nomineeFormData.dob)) {
      setOpenGuardianForm(true);
      return;
    }
    saveNominee();
  };

  const isMinor = (dob: string) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    return age < 18;
  };

  const saveNominee = () => {
    const newNominee = {
      id: `nominee-${Date.now()}`,
      nomineeName: `${nomineeFormData.firstName} ${nomineeFormData.middleName} ${nomineeFormData.lastName}`.trim(),
      nomineeShare: nomineeFormData.share,
      dob: nomineeFormData.dob,
      guardianName: guardianFormData.sameAsNominee ?
        `${nomineeFormData.firstName} ${nomineeFormData.middleName} ${nomineeFormData.lastName}`.trim() :
        `${guardianFormData.firstName} ${guardianFormData.middleName} ${guardianFormData.lastName}`.trim(),
      residualSecurity: nomineeFormData.residualSecurity,
    };

    const updatedNominees = [...(formData.nominee || []), newNominee];
    updateFormData("nominee", updatedNominees);
    setOpenAddNominee(false);
    setOpenGuardianForm(false);
    resetForms();
  };

  const resetForms = () => {
    setNomineeFormData(initialNomineeFormData);
    setGuardianFormData(initialGuardianFormData);
  };

  const handleDocumentUpload = (type: string) => {
    setCurrentDocumentType(type);
    setOpenDocumentUpload(true);
  };

  return (
    <div>
      <DataGrid
        columns={columns}
        rows={formData.nominee || []}
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
        onClick={() => setOpenAddNominee(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Nominee
      </button>

      {/* Add Nominee Modal */}
      {openAddNominee && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-xl font-semibold mb-4">Add Nominee</h4>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sameAsCorrespondence}
                  onChange={(e) => setSameAsCorrespondence(e.target.checked)}
                  className="mr-2"
                />
                Same as correspondence address
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={nomineeFormData.firstName}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={nomineeFormData.middleName}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={nomineeFormData.lastName}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address 1</label>
                <input
                  type="text"
                  name="address1"
                  value={nomineeFormData.address1}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address 2</label>
                <input
                  type="text"
                  name="address2"
                  value={nomineeFormData.address2}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address 3</label>
                <input
                  type="text"
                  name="address3"
                  value={nomineeFormData.address3}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={nomineeFormData.pincode}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={nomineeFormData.city}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">State</label>
                <Select
                  options={stateOptions}
                  value={nomineeFormData.state}
                  onChange={(selected) => handleNomineeSelectChange('state', selected)}
                  className="basic-single"
                  classNamePrefix="select"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={nomineeFormData.country}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={nomineeFormData.dob}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  value={nomineeFormData.mobile}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nominee Aadhar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="aadhar"
                    value={nomineeFormData.aadhar}
                    onChange={handleNomineeFormChange}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  />
                  <button
                    onClick={() => handleDocumentUpload('aadhar')}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nominee PAN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="pan"
                    value={nomineeFormData.pan}
                    onChange={handleNomineeFormChange}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  />
                  <button
                    onClick={() => handleDocumentUpload('pan')}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nominee Relation</label>
                <Select
                  options={relationOptions}
                  value={nomineeFormData.relation}
                  onChange={(selected) => handleNomineeSelectChange('relation', selected)}
                  className="basic-single"
                  classNamePrefix="select"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nominee Share (%)</label>
                <input
                  type="number"
                  name="share"
                  value={nomineeFormData.share}
                  onChange={handleNomineeFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="residualSecurity"
                  checked={nomineeFormData.residualSecurity}
                  onChange={handleNomineeFormChange}
                  className="mr-2 h-4 w-4"
                />
                <label className="text-sm font-medium">Residual Security</label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setOpenAddNominee(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNominee}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guardian Form Modal (for minors) */}
      {/* Guardian Form Modal (for minors) */}
      {openGuardianForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-xl font-semibold mb-4">Guardian Details (Nominee is Minor)</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Guardian Personal Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={guardianFormData.firstName}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={guardianFormData.middleName}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={guardianFormData.lastName}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              {/* Address Section with Same as Nominee checkbox */}
              <div className="col-span-full mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="sameAsNomineeAddress"
                    checked={guardianFormData.sameAsNomineeAddress}
                    onChange={handleSameAsNomineeAddressChange}
                    className="mr-2"
                  />
                  Same as nominee address
                </label>
              </div>

              {!guardianFormData.sameAsNomineeAddress && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Address 1</label>
                    <input
                      type="text"
                      name="address1"
                      value={guardianFormData.address1}
                      onChange={handleGuardianFormChange}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Address 2</label>
                    <input
                      type="text"
                      name="address2"
                      value={guardianFormData.address2}
                      onChange={handleGuardianFormChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Address 3</label>
                    <input
                      type="text"
                      name="address3"
                      value={guardianFormData.address3}
                      onChange={handleGuardianFormChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={guardianFormData.city}
                      onChange={handleGuardianFormChange}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">State</label>
                    <Select
                      options={stateOptions}
                      value={guardianFormData.state}
                      onChange={(selected) => handleGuardianSelectChange('state', selected)}
                      className="basic-single"
                      classNamePrefix="select"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={guardianFormData.pincode}
                      onChange={handleGuardianFormChange}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </>
              )}

              {/* Contact and Document Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <input
                  type="text"
                  name="mobile"
                  value={guardianFormData.mobile}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Guardian PAN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="pan"
                    value={guardianFormData.pan}
                    onChange={handleGuardianFormChange}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  />
                  <button
                    onClick={() => handleDocumentUpload('guardian_pan')}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Guardian Aadhar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="aadhar"
                    value={guardianFormData.aadhar}
                    onChange={handleGuardianFormChange}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  />
                  <button
                    onClick={() => handleDocumentUpload('guardian_aadhar')}
                    className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={guardianFormData.email}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={guardianFormData.dob}
                  onChange={handleGuardianFormChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Relationship</label>
                <Select
                  options={[
                    { value: 'father', label: 'Father' },
                    { value: 'mother', label: 'Mother' },
                    { value: 'guardian', label: 'Legal Guardian' }
                  ]}
                  value={guardianFormData.relationship}
                  onChange={(selected) => handleGuardianSelectChange('relationship', selected)}
                  className="basic-single"
                  classNamePrefix="select"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setOpenGuardianForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Back
              </button>
              <button
                onClick={saveNominee}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Document Upload Modal */}
      {openDocumentUpload && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-xl font-semibold mb-4">
              Upload {currentDocumentType === 'aadhar' ? 'Aadhar Card' :
                currentDocumentType === 'pan' ? 'PAN Card' :
                  currentDocumentType === 'guardian_aadhar' ? 'Guardian Aadhar Card' : 'Guardian PAN Card'}
            </h4>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setOpenDocumentUpload(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => setOpenDocumentUpload(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nominee;