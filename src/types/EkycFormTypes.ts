export interface EntryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageData: any;
    editData?: any;
    action?: 'edit' | 'delete' | 'view' | null;
    setEntryEditData?: React.Dispatch<React.SetStateAction<any>>;
    refreshFunction?: () => void;
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export interface FormField {
    isResizable: string;
    GetResponseFlag: string;
    OTPRequire: string;
    Srno: number;
    type: string;
    label: string;
    redirectUrl: string;
    ThirdPartyAPI: any;
    childDependents?: string[];
    wKey: string;
    FieldSize: string;
    iscreatable: string;
    FieldType: string;
    ValidationAPI: any;
    FieldEnabledTag: string;
    wQuery?: {
        Sql: string;
        J_Ui: any;
        X_Filter: string;
        X_Filter_Multiple?: any;
        J_Api: any;
    };
    wDropDownKey?: {
        key: string;
        value: string;
    };
    wValue?: string;
    dependsOn?: {
        field: string;
        wQuery: {
            Sql: string;
            J_Ui: any;
            X_Filter: string;
            X_Filter_Multiple?: any;
            J_Api: any;
        };
    };
}

export interface EntryFormProps {
    formData: FormField[];
    formValues: Record<string, any>;
    masterValues: Record<string, any>;
    setFormValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    dropdownOptions: Record<string, any[]>;
    loadingDropdowns: Record<string, boolean>;
    onDropdownChange?: (key: string, value: any) => void;
    fieldErrors: Record<string, string>;
    setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    setValidationModal: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        message: string;
        type: 'M' | 'S' | 'E' | 'D';
        callback?: (confirmed: boolean) => void;
    }>>;
    setDropDownOptions: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

export interface ChildEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterValues: Record<string, any>;
    formData: FormField[];
    masterFormData: FormField[];
    formValues: Record<string, any>;
    setFormValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    dropdownOptions: Record<string, any[]>;
    loadingDropdowns: Record<string, boolean>;
    onDropdownChange?: (key: string, value: any) => void;
    fieldErrors: Record<string, string>;
    setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    resetChildForm: () => void;
    isEdit: boolean;
    onChildFormSubmit: () => void;
    setValidationModal: React.Dispatch<React.SetStateAction<{
        isOpen: boolean;
        message: string;
        type: 'M' | 'S' | 'E' | 'D';
        callback?: (confirmed: boolean) => void;
    }>>;
    viewAccess: boolean;
    isLoading: boolean;
    setChildEntriesTable: React.Dispatch<React.SetStateAction<any[]>>;
    setDropDownOptions: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}


export interface EkycComponentProps {
    formFields: any[];
    tableData: any[];
    fieldErrors?: Record<string, string>;
    setFieldData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}