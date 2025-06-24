"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SaveLoadingContextType {
  isSaving: boolean;
  setSaving: (loading: boolean) => void;
}

const SaveLoadingContext = createContext<SaveLoadingContextType | undefined>(undefined);

export const SaveLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSaving, setIsSaving] = useState(false);

  const setSaving = (loading: boolean) => {
    setIsSaving(loading);
  };

  return (
    <SaveLoadingContext.Provider value={{ isSaving, setSaving }}>
      {children}
    </SaveLoadingContext.Provider>
  );
};

export const useSaveLoading = (): SaveLoadingContextType => {
  const context = useContext(SaveLoadingContext);
  if (!context) {
    throw new Error('useSaveLoading must be used within a SaveLoadingProvider');
  }
  return context;
};
