export const getDropdownStyles = (colors: any, isDisabled: boolean, fieldErrors: Record<string, string>, field: FormField, isJustUpdated: boolean = false, fieldWidth?: string) => ({
  control: (base: any, state: any) => ({
    ...base,
    width: `${fieldWidth != null ? fieldWidth : field.FieldWidth + 'px'}`,
    height: '30px', // Set fixed height
    minHeight: '30px', // Ensure minimum height
    borderRadius: "6px",
    borderColor: state.isFocused
      ? '#3b82f6'
      : !isDisabled
        ? fieldErrors[field.wKey]
          ? 'red'
          : '#374151'
        : '#d1d5db',
    boxShadow: state.isFocused
      ? '0 0 0 3px rgba(59, 130, 246, 0.5)'
      : 'none',
    backgroundColor: isDisabled
      ? '#f2f2f0'
      : colors.textInputBackground,
    '&:hover': {
      borderColor: state.isFocused
        ? '#3b82f6'
        : !isDisabled
          ? fieldErrors[field.wKey]
            ? 'red'
            : '#374151'
          : '#d1d5db',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: '30px',
    padding: '0 8px', // Adjust padding if needed
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '30px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '8px', // Adjust padding to center the indicator
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: '8px', // Adjust padding to center the indicator
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize :"14px",
    color: isJustUpdated ? '#22c55e' : (isDisabled ? '#6b7280' : colors.textInputText),
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? colors.primary : colors.textInputBackground,
    color: state.isFocused ? colors.buttonText : colors.textInputText,
  }),
  input: (base: any) => ({
    ...base,
    color: isJustUpdated ? '#22c55e' : colors.textInputText,
    fontSize :"14px",
    margin: '0px', // Remove default margins
    padding: '0px', // Remove default padding
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: colors.textInputBackground,
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999, 
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize :"14px",
    color: isDisabled ? '#9ca3af' : base.color,
  }),
});