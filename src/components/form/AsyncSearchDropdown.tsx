"use client";
import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import debounce from "lodash.debounce";
import { FormElement } from "../FormCreator";

interface AsyncSearchDropdownProps {
  item: FormElement;
  value: any;
  onChange: (value: any) => void;
  colors: any;
  formData: FormElement[][];
  formValues: any;
  handleFormChange: (values: any) => void;
  fetchDependentOptions: (
    item: FormElement,
    parentValue: string | Record<string, any>,
    searchQuery?: string
  ) => Promise<any[]>;
  isHorizontal?: boolean;
}

const AsyncSearchDropdown: React.FC<AsyncSearchDropdownProps> = ({
  item,
  value,
  onChange,
  colors,
  formData,
  formValues,
  handleFormChange,
  fetchDependentOptions,
  isHorizontal = false,
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const minSearchLength = item.dynamicSearch?.minSearchLength || 3;
  const debounceMs = item.dynamicSearch?.debounceMs || 400;

  // Get dependency values (if any)
  const dependencyValues = (() => {
    if (!item.dependsOn) return {};
    if (Array.isArray(item.dependsOn.field)) {
      return item.dependsOn.field.reduce((acc, f) => {
        acc[f] = formValues[f];
        return acc;
      }, {} as Record<string, any>);
    } else {
      return { [item.dependsOn.field]: formValues[item.dependsOn.field] };
    }
  })();

  /**
   * 🔄 When dependency values change, clear options and selection
   */
  useEffect(() => {
    // If any parent field changed, reset dropdown completely
    setOptions([]);
    if (value) {
      const newValues = { ...formValues, [item.wKey as string]: undefined };
      handleFormChange(newValues);
      onChange(undefined);
    }
  }, [JSON.stringify(dependencyValues)]);

  /**
   * 🔍 Debounced async search handler
   */
  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < minSearchLength) {
        setOptions([]);
        if (value) {
          // clear selection if user deletes search text
          const newValues = { ...formValues, [item.wKey as string]: undefined };
          handleFormChange(newValues);
          onChange(undefined);
        }
        return;
      }

      setIsLoading(true);
      setOptions([]); // clear old options before new fetch

      const opts = await fetchDependentOptions(item, dependencyValues, query);

      if (!opts || opts.length === 0) {
        // ✅ clear value if backend returned empty
        const newValues = { ...formValues, [item.wKey as string]: undefined };
        handleFormChange(newValues);
        onChange(undefined);
      }

      setOptions([...opts]); // always new reference
      setIsLoading(false);
    }, debounceMs),
    [
      item,
      value,
      dependencyValues,
      debounceMs,
      minSearchLength,
      handleFormChange,
      onChange,
      formValues,
      fetchDependentOptions,
    ]
  );

  /**
   * ✅ Handle selection change
   */
  const handleChange = (selected: any) => {
    const newValues = { ...formValues };
    newValues[item.wKey as string] = selected?.value ?? undefined;
    onChange(selected?.value);
    handleFormChange(newValues);
  };

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  return (
    <div className={isHorizontal ? "mb-2" : "mb-4"}>
      <label
        className={`block text-sm mb-1 ${
          isHorizontal ? "font-bold" : "font-medium"
        }`}
        style={{ color: colors.text }}
      >
        {item.label}
        {isLoading && (
          <span className="ml-2 inline-block animate-pulse text-xs">
            Loading...
          </span>
        )}
      </label>

      <Select
        key={item.wKey as string}
        value={selectedOption || null}
        options={options}
        isLoading={isLoading}
        placeholder="Search..."
        noOptionsMessage={() =>
          isLoading ? "Loading..." : "No results found"
        }
        onInputChange={(inputValue, { action }) => {
          if (action === "input-change") handleSearch(inputValue);
          return inputValue;
        }}
        onChange={handleChange}
        styles={{
          control: (base) => ({
            ...base,
            borderColor: colors.textInputBorder,
            backgroundColor: colors.textInputBackground,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
              ? colors.primary
              : colors.textInputBackground,
            color: state.isFocused ? colors.buttonText : colors.textInputText,
          }),
        }}
      />
    </div>
  );
};

export default AsyncSearchDropdown;
