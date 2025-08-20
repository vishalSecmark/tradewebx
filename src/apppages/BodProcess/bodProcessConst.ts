import apiService from "@/utils/apiService"
import { BASE_URL, PATH_URL } from "@/utils/constants"


const userId = localStorage.getItem('userId');

const userType = localStorage.getItem('userType') || '';


export const  bodProcessGetApiCall = async(setBodProcessApiData) => {


    const xml = 
    `<dsXml>                
    <J_Ui>"ActionName":"Tradeweb","Option":"GetBODData","RequestFrom":"W"</J_Ui>\n
    <Sql/>
    <X_Filter></X_Filter>
    <J_Api>"UserId":"${userId}","AccYear":24,"MyDbPrefix":"SVVS","MenuCode":7,"ModuleID":0,"MyDb":null,"DenyRights":null,"UserType":"${userType}"</J_Api>
    </dsXml>`

    try{

        const response = await apiService.postWithAuth(BASE_URL + PATH_URL,xml)
        const apiData = response?.data?.data?.rs0
        if(apiData)  setBodProcessApiData(apiData)
       
    }catch(error){
        console.error(error)
    }
}


export const  bodProcessIndividualApiCall = async(rowValue,showValidationMessage,setLoading) => {
    setLoading(true)

    const xmlData = 
    `<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"RunBOD","Level":1,"RequestFrom":"W"</J_Ui>
    <Sql></Sql>
    <X_Filter>
    <ProcessName>${rowValue}</ProcessName>
    </X_Filter>
    <J_Api>"UserId":"${userId}","UserType":"${userType}","AccYear":24,"MyDbPrefix":"SVVS","MemberCode":"undefined","SecretKey":"undefined"</J_Api>
    </dsXml>`

    try {
        const response = await apiService.postWithAuth(BASE_URL + PATH_URL,xmlData)
        console.log(response,'bodProcessIndividualApiCall')
        const apiData = response?.data?.data?.rs0[0]
        const errorMessage = apiData?.["Error Message"];
        const flagStatus = apiData?.ErrorFlag
        if(apiData){
            showValidationMessage(errorMessage,flagStatus)
            setLoading(false)
        }
        

        
    } catch (error) {
        console.error(error)
    }


}






