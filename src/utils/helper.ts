import { THEME_COLORS_STORAGE_KEY, THEME_STORAGE_KEY } from "@/context/ThemeContext";
import { APP_METADATA_KEY } from "./constants";

export const clearLocalStorage = () => {
    const appMetadata = localStorage.getItem(APP_METADATA_KEY);
    const appThemeColors = localStorage.getItem(THEME_COLORS_STORAGE_KEY);
    const appTheme = localStorage.getItem(THEME_STORAGE_KEY);
    localStorage.clear();
    localStorage.setItem(APP_METADATA_KEY, appMetadata);
    if (appThemeColors) localStorage.setItem(THEME_COLORS_STORAGE_KEY, appThemeColors);
    if (appTheme) localStorage.setItem(THEME_STORAGE_KEY, appTheme);
}

export function handleViewFile(base64Data: string, fieldType: string = 'file') {
    if (!base64Data?.startsWith('data:')) {
        alert("Invalid file data");
        return;
    }

    const match = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        alert("Invalid base64 structure");
        return;
    }

    const mimeType = match[1];
    const base64 = match[2];

    try {
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);

        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const newTab = window.open(blobUrl, '_blank');

        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `uploaded-file.${fieldType || 'file'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        alert("Unable to preview file.");
    }
}