import { FormField, GroupedFormData } from "@/types";

 export function groupFormData(
        fields: FormField[],
        isGroup: boolean
    ): GroupedFormData[] {
        if (!isGroup) {
            return [{ groupName: "", fields }];
        }

        const groups = fields.reduce<Record<string, FormField[]>>((acc, field) => {
            const groupName = field.CombinedName?.trim() || "";
            if (groupName) {
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(field);
            } else {
                if (!acc.__ungrouped) acc.__ungrouped = [];
                acc.__ungrouped.push(field);
            }
            return acc;
        }, {});

        return Object.entries(groups).map(([groupName, fields]) => ({
            groupName: groupName !== "__ungrouped" ? groupName : "",
            fields,
        }));
}

export const validateForm = (formData, formValues) => {
    const errors = {};
    formData.forEach(field => {
        if (field.FieldEnabledTag === "Y" && field.isMandatory === "true" && field.type !== "WDisplayBox") {
            if (!formValues[field.wKey] || formValues[field.wKey]?.toString()?.trim() === "") {
                errors[field.wKey] = `${field.label} is required`;
            }
        }
    });
    return errors;
};

// Helper function to generate unique ID
export const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export function parseXMLStringToObject(xmlString) {
    const result = {};
    
    // Regular expression to match XML tags with content
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    
    let match;
    
    while ((match = tagRegex.exec(xmlString)) !== null) {
        const tagName = match[1];
        const tagValue = match[2].trim();
        
        // Only add to result if the value is not empty
        if (tagValue !== '') {
            result[tagName] = tagValue;
        }
    }
    
    return result;
}
