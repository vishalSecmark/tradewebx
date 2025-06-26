import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormErrorContextType {
  fieldErrors: Record<string, string>;
  setFieldError: (fieldKey: string, error: string) => void;
  clearFieldError: (fieldKey: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getFieldError: (fieldKey: string) => string | undefined;
  setBatchErrors: (errors: Record<string, string>) => void;
  clearBatchErrors: (fieldKeys: string[]) => void;
  validateRequiredFields: (formFields: any[], formValues: Record<string, any>) => boolean;
}

const FormErrorContext = createContext<FormErrorContextType | undefined>(undefined);

export const FormErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (fieldKey: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [fieldKey]: error }));
  };

  const clearFieldError = (fieldKey: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  };

  const clearAllErrors = () => {
    setFieldErrors({});
  };

  const setBatchErrors = (errors: Record<string, string>) => {
    setFieldErrors(prev => ({ ...prev, ...errors }));
  };

  const clearBatchErrors = (fieldKeys: string[]) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      fieldKeys.forEach(key => delete updated[key]);
      return updated;
    });
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;

  const getFieldError = (fieldKey: string) => fieldErrors[fieldKey];

  const validateRequiredFields = (formFields: any[], formValues: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    formFields.forEach(field => {
      if (field.isMandatory === "true" || field.isMandatory === true) {
        const value = formValues[field.wKey];
        if (!value || value.toString().trim() === "") {
          errors[field.wKey] = `${field.label} is required`;
        }
      }
    });

    setBatchErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <FormErrorContext.Provider value={{
      fieldErrors,
      setFieldError,
      clearFieldError,
      clearAllErrors,
      hasErrors,
      getFieldError,
      setBatchErrors,
      clearBatchErrors,
      validateRequiredFields
    }}>
      {children}
    </FormErrorContext.Provider>
  );
};

export const useFormErrors = () => {
  const context = useContext(FormErrorContext);
  if (!context) {
    throw new Error('useFormErrors must be used within a FormErrorProvider');
  }
  return context;
};
