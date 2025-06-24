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


export const handleSaveSinglePageData = async (settings: any, JsonData: any, setActiveTab?: any, tabName?:string) => {
    if (!settings) return;
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
            // const escapedJsonString = jsonString.replace(/&/g, '&amp;');

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
            if(response.data?.success){
                toast.success(response.data?.data?.rs0[0]?.Column1 || "Data saved successfully");
                setActiveTab(tabName);
            }else{
                toast.error(response.data.message || "something went wrong while saving data")
            }
            console.log('Response from saveSinglePageData:', response.data);
        } catch (error) {
            console.error(`Error fetching options for `, error);
        }
}