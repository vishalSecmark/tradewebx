"use client";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import Select from 'react-select';

interface PersonalProps {
    formData: any;
    updateFormData: (data: any) => void;
}

interface OTPVerificationModalProps {
    isOpen: boolean;
    fieldName: string;
    currentValue: string;
    newValue: string;
    onVerify: (otp: string, relation: string) => void;
    onCancel: () => void;
    verificationStep: number;
    contactMethod: string;
}

interface IncomeModalProps {
    isOpen: boolean;
    currentIncome: string;
    onSave: (incomeDetails: any) => void;
    onCancel: () => void;
}

const incomeOptions = [
    { value: "below_1_lakh", label: "Below ₹1 Lakh" },
    { value: "1_to_5_lakh", label: "₹1 Lakh to ₹5 Lakh" },
    { value: "5_to_10_lakh", label: "₹5 Lakh to ₹10 Lakh" },
    { value: "10_to_25_lakh", label: "₹10 Lakh to ₹25 Lakh" },
    { value: "25_lakh_to_1_cr", label: "₹25 Lakh to ₹1 CR" },
    { value: "above_1_cr", label: "Above ₹1 CR" }
];

const IncomeModal: React.FC<IncomeModalProps> = ({
    isOpen,
    currentIncome,
    onSave,
    onCancel
}) => {
    const [incomeDate, setIncomeDate] = useState<Date | null>(null);
    const [incomeRange, setIncomeRange] = useState(currentIncome);
    const [incomeProof, setIncomeProof] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setIncomeProof(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({
            incomeRange,
            incomeDate,
            incomeProof
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-[400px]">
                <h4 className="text-xl font-semibold mb-4">Income Details</h4>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Income Range</label>
                    <Select
                        options={incomeOptions}
                        value={incomeOptions.find(option => option.value === incomeRange)}
                        onChange={(selected) => setIncomeRange(selected?.value || currentIncome)}
                        className="basic-single"
                        classNamePrefix="select"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Income Date</label>
                    <DatePicker
                        selected={incomeDate}
                        onChange={(date: Date | null) => setIncomeDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholderText="Select income date"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Income Proof</label>
                    <input
                        type="file"
                        className="w-full px-3 py-2 border rounded-md"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        disabled={!incomeDate || !incomeProof}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
    isOpen,
    fieldName,
    currentValue,
    newValue,
    onVerify,
    onCancel,
    verificationStep,
    contactMethod
}) => {
    const [otp, setOtp] = useState("");
    const [email,setEmail] = useState(newValue);
    const [phone,setPhone] = useState(newValue);
    const [relation, setRelation] = useState("self");

    const relationOptions = [
        { value: "self", label: "Self" },
        { value: "spouse", label: "Spouse" },
        { value: "dependent_children", label: "Dependent Children" },
        { value: "dependent_parent", label: "Dependent Parent" }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-[400px]">
                <h4 className="text-xl font-semibold mb-4">
                    {verificationStep === 1
                        ? `Verify Current ${fieldName}`
                        : `Verify New ${fieldName}`}
                </h4>

                <p className="text-gray-600 mb-2">
                    {verificationStep === 1
                        ? `We've sent an OTP to your ${contactMethod}. Please enter it below.`
                        : `We've sent an OTP to the new ${fieldName === 'email' ? 'email' : 'mobile number'}. Please enter it below.`}
                </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">${fieldName === 'email' ? 'email' : 'mobile number'}</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={fieldName === "email" ? email : phone}
                        onChange={(e) => {
                            if(fieldName === "email"){
                                setEmail(e.target.value)
                            }else{
                                setPhone(e.target.value)
                            }
                        }}
                        placeholder="Enter phone email"
                    />
                </div>


                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Relation</label>
                    <Select
                        options={relationOptions}
                        defaultValue={relationOptions[0]}
                        onChange={(selected) => setRelation(selected?.value || "self")}
                        className="basic-single"
                        classNamePrefix="select"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">OTP</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onVerify(otp, relation)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                        Verify
                    </button>
                </div>
            </div>
        </div>
    );
};

const Personal = ({ formData, updateFormData }: PersonalProps) => {
    const [editingField, setEditingField] = useState<{ name: string, value: string } | null>(null);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [verificationStep, setVerificationStep] = useState(1);
    const [tempValue, setTempValue] = useState("");
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [tempIncomeValue, setTempIncomeValue] = useState("");

    // Static values for the read-only fields
    const formValues = {
        name: "John Doe",
        father_name: "Robert Doe",
        gender: "Male",
        address: "",
        aadhar_number: "1234 5678 9012",
        email: "",
        mobile_number: "",
        pan_number: "ABCDE1234F",
        annual_income: "",
        annual_income_date: null,
        nationality: "Indian",
        date_of_birth: "19900101",
        marital_status: "Single",
        occupation: "Software Engineer",
        religion: "Hindu",
        category: "General",
        signature: null,
    };

    const colors = {
        text: "#333333",
        textInputBackground: "#ffffff",
        textInputText: "#000000",
    };

    const isEnabled = true;
    const marginBottom = "mb-2";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log("name email",name , value, formData[name]);
        if ((name === 'email' || name === 'mobile_number') && value !== formData[name]) {
            setTempValue(value);
            setEditingField({ name, value });
            setVerificationStep(1);
            setShowOTPModal(true);
        }
    };

    const handleIncomeChange = (selectedOption: any) => {
        setTempIncomeValue(selectedOption.value);
        setShowIncomeModal(true);
    };

    const handleSaveIncomeDetails = (incomeDetails: any) => {
        updateFormData({
            annual_income: incomeDetails.incomeRange,
            annual_income_date: incomeDetails.incomeDate,
            annual_income_proof: incomeDetails.incomeProof
        });
        setShowIncomeModal(false);
    };

    const handleVerifyOTP = (otp: string, relation: string) => {
        console.log(`Verifying OTP ${otp} for ${editingField?.name} with relation ${relation}`);

        if (verificationStep === 1) {
            setVerificationStep(2);
        } else {
            if (editingField) {
                updateFormData({
                    [editingField.name]: tempValue,
                    [`${editingField.name}_verified`]: true,
                    [`${editingField.name}_relation`]: relation
                });
            }
            setShowOTPModal(false);
            setVerificationStep(1);
            setEditingField(null);
        }
    };

    const handleCancelVerification = () => {
        setShowOTPModal(false);
        setVerificationStep(1);
        setEditingField(null);
    };

    return (
        <div className="w-full p-5 bg-white rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Name (read-only) */}
                <div key={`textBox-name`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Name
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.name}
                        readOnly
                    />
                </div>

                {/* Father/Husband Name (read-only) */}
                <div key={`textBox-father_name`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Father / Husband Name
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.father_name}
                        readOnly
                    />
                </div>

                {/* Gender (read-only) */}
                <div key={`textBox-gender`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Gender
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.gender}
                        readOnly
                    />
                </div>

                {/* Aadhar Number (read-only) */}
                <div key={`textBox-aadhar_number`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Aadhar Number
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.aadhar_number}
                        readOnly
                    />
                </div>

                {/* PAN Number (read-only) */}
                <div key={`textBox-pan_number`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        PAN Number
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.pan_number}
                        readOnly
                    />
                </div>

                {/* Nationality (read-only) */}
                <div key={`textBox-nationality`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Nationality
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.nationality}
                        readOnly
                    />
                </div>

                {/* Date of Birth (read-only) */}
                <div key={`dateBox-date_of_birth`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Date of Birth
                    </label>
                    <DatePicker
                        selected={moment(formValues.date_of_birth, "YYYYMMDD").toDate()}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        wrapperClassName="w-full"
                        readOnly
                    />
                </div>

                {/* Marital Status (read-only) */}
                <div key={`textBox-marital_status`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Marital Status
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.marital_status}
                        readOnly
                    />
                </div>

                {/* Occupation (read-only) */}
                <div key={`textBox-occupation`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Occupation
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.occupation}
                        readOnly
                    />
                </div>

                {/* Religion (read-only) */}
                <div key={`textBox-religion`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Religion
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.religion}
                        readOnly
                    />
                </div>

                {/* Category (read-only) */}
                <div key={`textBox-category`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Category
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-1 border rounded-md border-gray-300 bg-[#f2f2f0]"
                        value={formValues.category}
                        readOnly
                    />
                </div>
            </div>

            {/* Address (textarea) */}
            <div className="grid">
                <div key={`textBox-address`} className={marginBottom}>
                    <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                        Address
                    </label>
                    <textarea
                        className={`w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!isEnabled ? "border-gray-300 bg-[#f2f2f0]" : "border-gray-700"
                            }`}
                        name="address"
                        style={{
                            backgroundColor: colors.textInputBackground,
                            color: colors.textInputText,
                            minHeight: "100px",
                        }}
                        value={formData.address || ''}
                        onChange={handleChange}
                        disabled={!isEnabled}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Email */}
                    <div key={`textBox-email`} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            className={`w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!isEnabled ? "border-gray-300 bg-[#f2f2f0]" : "border-gray-700"
                                }`}
                            style={{
                                backgroundColor: colors.textInputBackground,
                                color: colors.textInputText,
                            }}
                            value={formData.email || formValues.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!isEnabled}
                        />
                    </div>

                    {/* Mobile Number */}
                    <div key={`textBox-mobile_number`} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            name="mobile_number"
                            className={`w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!isEnabled ? "border-gray-300 bg-[#f2f2f0]" : "border-gray-700"
                                }`}
                            style={{
                                backgroundColor: colors.textInputBackground,
                                color: colors.textInputText,
                            }}
                            value={formData.mobile_number || formValues.mobile_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!isEnabled}
                        />
                    </div>

                    {/* Annual Income (now a dropdown) */}
                    <div key={`selectBox-annual_income`} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            Annual Income
                        </label>
                        <Select
                            options={incomeOptions}
                            value={incomeOptions.find(option => option.value === (formData.annual_income || formValues.annual_income))}
                            onChange={handleIncomeChange}
                            className="basic-single"
                            classNamePrefix="select"
                            isDisabled={!isEnabled}
                        />
                    </div>

                    {/* Annual Income Date (now editable) */}
                    <div key={`dateBox-annual_income_date`} className={marginBottom}>
                        <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                            Annual Income Date
                        </label>
                        <DatePicker
                            selected={formData.annual_income_date ? moment(formData.annual_income_date).toDate() : null}
                            onChange={(date: Date | null)  => updateFormData({ annual_income_date: date })}
                            dateFormat="dd/MM/yyyy"
                            className={`w-full px-3 py-1 border rounded-md ${!isEnabled ? "border-gray-300 bg-[#f2f2f0]" : "border-gray-700"}`}
                            wrapperClassName="w-full"
                            readOnly={!isEnabled}
                            placeholderText="Select income date"
                        />
                    </div>
                </div>
            </div>

            {/* Signature Upload */}
            <div key={`fileBox-signature`} className={`${marginBottom} mt-2`}>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                    Upload Signature
                </label>
                <input
                    type="file"
                    name="signature"
                    className={`w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!isEnabled ? "border-gray-300 bg-[#f2f2f0]" : "border-gray-700"
                        }`}
                    style={{
                        backgroundColor: colors.textInputBackground,
                        color: colors.textInputText,
                        padding: "0.5rem",
                    }}
                    disabled={!isEnabled}
                    accept="image/*"
                />
            </div>

            {/* OTP Verification Modal */}
            {editingField && (
                <OTPVerificationModal
                    isOpen={showOTPModal}
                    fieldName={editingField.name === 'email' ? 'Email' : 'Mobile Number'}
                    currentValue={formData[editingField.name] || formValues[editingField.name as keyof typeof formValues]}
                    newValue={tempValue}
                    onVerify={handleVerifyOTP}
                    onCancel={handleCancelVerification}
                    verificationStep={verificationStep}
                    contactMethod={editingField.name === 'email'
                        ? (formData.mobile_number || formValues.mobile_number)
                        : (formData.email || formValues.email)}
                />
            )}

            {/* Income Details Modal */}
            <IncomeModal
                isOpen={showIncomeModal}
                currentIncome={tempIncomeValue}
                onSave={handleSaveIncomeDetails}
                onCancel={() => setShowIncomeModal(false)}
            />
        </div>
    );
};

export default Personal;