// src/types/apiConfigurationTypes.ts

// 🔹 Basic configuration row type (structure returned by your API)
export interface ApiConfigurationRow {
    VendorName?: string;
    ServiceName?: string;
    APIType?: string;
    APICallingType?: string;
    APIContantType?: string;
    ActiveFlag?: string;
    AutoAPIStartTime?: string;
    AutoAPIEndTime?: string;
    CallBackUrl?: string;
    APIUrl?: string;
    ParameterSetting?: string;
    [key: string]: any; // fallback for dynamic keys
  }
  
  // 🔹 Header info for logs modal
  export interface LogHeader {
    VendorName: string;
    ServiceName: string;
  }
  
  // 🔹 State for edit modal (long text edit)
  export interface EditModalState {
    key: string;
    value: string;
  }
  
  // 🔹 Type for all dropdown options used in API Config
  export const apiCallingTypes = ["POST", "GET"] as const;
  export const apiContentTypes = [
    "application/json",
    "application/xml",
    "multipart/form-data",
    "text/plain",
  ] as const;
  export const activeFlag = ["Y", "N"] as const;
  
  // 🔹 Props/state types for component
  export interface ApiConfigurationState {
    apiConfigData: ApiConfigurationRow[];
    uniqueKeys: string[];
    editIndex: number | null;
    editableRow: ApiConfigurationRow | null;
    viewLogServiceName: string;
    viewLogServiceNameApiData: any[];
    modalOpen: boolean;
    selectedText: string | null;
    editModal: EditModalState | null;
    loading: boolean;
    logLoading: boolean;
    viewLogHeader: LogHeader | null;
  }


 
  