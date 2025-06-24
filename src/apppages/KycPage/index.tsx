import Kyc from "./ekycPage"
import { SaveLoadingProvider } from "@/context/SaveLoadingContext"

const KycPage = () =>{
return (
    <SaveLoadingProvider>
     <Kyc/>
    </SaveLoadingProvider>
    
)
}

export default KycPage