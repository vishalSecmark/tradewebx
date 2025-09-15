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
