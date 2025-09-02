import { FormField } from "@/types";

export const getDropdownStyles = (colors: any, isDisabled: boolean, fieldErrors: Record<string, string>, field: FormField, isJustUpdated: boolean = false) => ({
  control: (base: any, state: any) => ({
    ...base,
    width: `${field.FieldWidth}px`,
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
  }),  singleValue: (base: any) => ({
    ...base,
    color: isJustUpdated ? '#22c55e' : (isDisabled ? '#6b7280' : colors.textInputText),
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? colors.primary : colors.textInputBackground,
    color: state.isFocused ? colors.buttonText : colors.textInputText,
  }),  input: (base: any) => ({
    ...base,
    color: isJustUpdated ? '#22c55e' : colors.textInputText,
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: colors.textInputBackground,
  }),
  menuPortal:( base : any) => ({
            ...base,
            zIndex: 9999, 
          }),
  placeholder: (base: any) => ({
    ...base,
    color: isDisabled ? '#9ca3af' : base.color,
  }),
});