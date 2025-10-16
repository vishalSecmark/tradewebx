
// Dropdown option structure
export interface GroupOption {
    value: string;
    label: string;
  }
  
  // Master record (rs0)
  export interface AccessMaster {
    GroupCode?: string;
    [key: string]: string | undefined;
  }
  
  // Menu record (rs1)
  export interface AccessMenu {
    GroupCode?: string;
    MenuCode?: string;
    MenuName?: string;
    MenuTag?: string;
    ParentMenu?: string;
    [key: string]: string | undefined;
  }
  
  // For summarizing boolean columns
  export interface CheckboxSummary {
    eligible: number;
    checked: number;
  }
  