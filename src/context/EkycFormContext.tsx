// context/FormContext.tsx
"use client";

import React, { createContext, useContext, useState } from 'react';

interface FormData {
  personal: any; // Replace with your actual personal info type
  nominee: any;
  bankDetails: any;
  dematAccounts: any;
  segments: any;
  rekyc: any;
}

interface FormContextType {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  updateFormData: (tabId: keyof FormData, data: any) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// Updated FormProvider with localStorage
export const EkycFormProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kycFormData');
      return saved ? JSON.parse(saved) : {
        personal: {},
        nominee: {},
        bankDetails: {},
        dematAccounts: {},
        segments: {},
        rekyc: {},
      };
    }
    return {
      personal: {},
      nominee: {},
      bankDetails: {},
      dematAccounts: {},
      segments: {},
      rekyc: {},
    };
  });

  const updateFormData = (tabId: keyof FormData, data: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [tabId]: {
          ...prev[tabId],
          ...data
        }
      };
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('kycFormData', JSON.stringify(newData));
      }
      return newData;
    });
  };

  return (
    <FormContext.Provider value={{ formData, setFormData, updateFormData }}>
      {children}
    </FormContext.Provider>
  );
};

export const useEkycFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};