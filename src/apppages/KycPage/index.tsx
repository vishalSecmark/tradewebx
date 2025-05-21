import { EkycFormProvider } from "@/context/EkycFormContext"
import Kyc from "./ekycPage"

const KycPage = () =>{
return (
    <EkycFormProvider>
        <Kyc/>
    </EkycFormProvider>
)
}

export default KycPage