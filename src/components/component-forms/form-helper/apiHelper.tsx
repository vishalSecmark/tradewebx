import apiService from "@/utils/apiService";
import { BASE_URL, PATH_URL } from "@/utils/constants";

export const handleNextValidationFields = async (
  editData,
  currentTab,
  masterFormValues,
  ) => {
  console.log("called this", Object.keys(currentTab?.Settings?.TabChangeAPI || {}).length, currentTab?.Settings?.TabChangeAPI);
  if (!Object.keys(currentTab?.Settings?.TabChangeAPI || {}).length) return;

  const { J_Ui, Sql, X_Filter, J_Api } = currentTab?.Settings?.TabChangeAPI;

  console.log("check", X_Filter);

  let xFilter = "";

  if (X_Filter && typeof X_Filter === 'object') {
    // Handle X_Filter as an object with key-value pairs
    const filterEntries = Object.entries(X_Filter).map(([key, value]) => {
      let fieldValue;
      
      if (typeof value === 'string' && value.startsWith("##") && value.endsWith("##")) {
        const formKey = value.slice(2, -2);
        fieldValue = editData ? editData[formKey] || masterFormValues[formKey] || "" : "";
      } else {
        fieldValue = value;
      }
      
      return `<${key}>${fieldValue}</${key}>`;
    });
    
    xFilter = filterEntries.join("");
  }

  console.log("called this", xFilter);
  
  const jUi = Object.entries(J_Ui || {})
    .map(([key, value]) => `"${key}":"${value}"`)
    .join(",");
    
  const jApi = Object.entries(J_Api || {})
    .map(([key, value]) => `"${key}":"${value}"`)
    .join(",");

  const xmlData = `<dsXml>
      <J_Ui>${jUi}</J_Ui>
      <Sql>${Sql || ""}</Sql>
      <X_Filter>${xFilter}</X_Filter>
      <X_Filter_Multiple></X_Filter_Multiple>
      <J_Api>${jApi}</J_Api>
  </dsXml>`;

  try {
    const response = await apiService.postWithAuth(BASE_URL + PATH_URL, xmlData);
    console.log("check my res--->", response);
  } catch (error) {
    console.error("Validation API error:", error);
  }
};