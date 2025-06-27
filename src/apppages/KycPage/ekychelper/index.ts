import { BASE_URL, PATH_URL } from "@/utils/constants";
import axios from "axios";
import { toast } from "react-toastify";

export const fetchEkycDropdownOptions = async (field: any, setMasterDropdownOptions: any, setMasterLoadingDropdowns:any) => {
        if (!field.wQuery) return;
        try {
            setMasterLoadingDropdowns(prev => ({ ...prev, [field.wKey]: true }));
            const jUi = Object.entries(field.wQuery.J_Ui)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            const jApi = Object.entries(field.wQuery.J_Api)
                .map(([key, value]) => `"${key}":"${value}"`)
                .join(',');

            const xmlData = `<dsXml>
                <J_Ui>${jUi}</J_Ui>
                <Sql>${field.wQuery.Sql || ''}</Sql>
                <X_Filter>${field.wQuery.X_Filter || ''}</X_Filter>
                <J_Api>${jApi}</J_Api>
            </dsXml>`;

            const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
                }
            });

            const options = response.data?.data?.rs0?.map((item: any) => ({
                label: item[field.wDropDownKey?.key || 'DisplayName'],
                value: item[field.wDropDownKey?.value || 'Value']
            }));

            setMasterDropdownOptions(prev => ({ ...prev, [field.wKey]: options }));
        } catch (error) {
            console.error(`Error fetching options for ${field.wKey}:`, error);
        } finally {
            setMasterLoadingDropdowns(prev => ({ ...prev, [field.wKey]: false }));
        }
    };


export const handleSaveSinglePageData = async (
    settings: any, 
    JsonData: any, 
    setActiveTab?: any, 
    tabName?: string,
    setSaving?: (loading: boolean) => void
) => {
    if (!settings) return;
    
    // Set loading state to true when starting the save operation
    if (setSaving) setSaving(true);
    
    try {
        const jUi = Object.entries(settings.J_Ui)
            .map(([key, value]) => `"${key}":"${value}"`)
            .join(',');

        const jApi = Object.entries(settings.J_Api)
            .map(([key, value]) => `"${key}":"${value}"`)
            .join(',');

        // Construct X_Filter with edit data if available
        const formData = JsonData || {};
        let XFilterMultiple = '';
        Object.entries(settings.X_Filter_Multiple).forEach(([key, value]) => {
                XFilterMultiple += `<${key}>${value}</${key}>`;
        });

        // Stringify first, then escape ampersands
        const jsonString = JSON.stringify(formData);

        const xmlData = `<dsXml>
        <J_Ui>${jUi}</J_Ui>
        <Sql>${settings.Sql || ''}</Sql>
        <X_Filter></X_Filter>
        <X_DataJson>${jsonString}</X_DataJson>
        <X_Filter_Multiple>${XFilterMultiple || ''}</X_Filter_Multiple>
        <J_Api>${jApi}</J_Api>
        </dsXml>`;
        
        const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
            headers: {
                'Content-Type': 'application/xml',
                'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
            }
        });

        if (response.data?.success) {
            const responseData = response.data?.data?.rs0?.[0];
            
            if (responseData?.Flag === "E") {
                // Error case
                toast.error(responseData.Message || "Error saving data");
            } else if (responseData?.Flag === "S") {
                // Success case
                toast.success(responseData.Message || "Data saved successfully");
                if (setActiveTab && tabName) {
                    setActiveTab(tabName);
                }
            } else {
                // Handle other cases or default success
                toast.error(responseData.Message || "Something went wrong");
            }
        } else {
            toast.error(response.data.message || "Something went wrong while saving data");
        }
        
        console.log('Response from saveSinglePageData:', response.data);
    } catch (error) {
        console.error(`Error saving data:`, error);
        toast.error("An error occurred while saving data");
    } finally {
        // Set loading state to false when operation completes (success or error)
        if (setSaving) setSaving(false);
    }
}