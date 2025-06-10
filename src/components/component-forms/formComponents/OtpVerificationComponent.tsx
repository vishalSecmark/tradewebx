// components/OtpVerificationModal.tsx
import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BASE_URL, PATH_URL } from '@/utils/constants';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedValue: string) => void;
  field: any;
  formValues: Record<string, any>;
  masterValues: Record<string, any>;
  type: 'email' | 'mobile';
  oldValue: string;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  field,
  formValues,
  masterValues,
  type,
  oldValue
}) => {
  // Stepper states
  const [currentStep, setCurrentStep] = useState<'old' | 'new' | 'complete'>('old');
  const [newValue, setNewValue] = useState('');
  const [oldOtp, setOldOtp] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState({
    old: false,
    new: false
  });

  // Check if we need to verify new value based on OTPRequire field
  const needsNewVerification = field.OTPRequire?.includes('NEW');
  const needsOldVerification = field.OTPRequire?.includes('OLD');

  const handleSendOtp = async (value: string, isOld: boolean) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { J_Ui = {}, X_Filter_Multiple = {}, J_Api = {} } = field.OTPSend.dsXml;
      
      let xFilterMultiple = '';
      Object.entries(X_Filter_Multiple).forEach(([key, placeholder]) => {
        let fieldValue;
        if (typeof placeholder === 'string' && placeholder.startsWith('##') && placeholder.endsWith('##')) {
          const formKey = placeholder.slice(2, -2);
          fieldValue = formValues[formKey] || masterValues[formKey];
        } else {
          fieldValue = value;
        }
        xFilterMultiple += `<${key}>${fieldValue}</${key}>`;
      });

      const jUi = Object.entries(J_Ui).map(([key, val]) => `"${key}":"${val}"`).join(',');
      const jApi = Object.entries(J_Api).map(([key, val]) => `"${key}":"${val}"`).join(',');

      const xmlData = `<dsXml>
        <J_Ui>${jUi}</J_Ui>
        <X_Filter_Multiple>${xFilterMultiple}</X_Filter_Multiple>
        <J_Api>${jApi}</J_Api>
      </dsXml>`;

      const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
        }
      });

      if (response.data?.data?.rs0?.[0]?.Column1?.includes("<Flag>S</Flag>")) {
        toast.success(`OTP sent to ${type} ${isOld ? oldValue : newValue}`);
        setOtpSent(prev => ({ ...prev, [isOld ? 'old' : 'new']: true }));
      } else {
        setError(`Failed to send OTP. Please try again.`);
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue: string, isOld: boolean) => {
    setIsLoading(true);
    setError('');
    
    try {
      const { J_Ui = {}, X_Filter_Multiple = {}, J_Api = {} } = field.OTPValidate.dsXml;
      
      let xFilterMultiple = '';
      Object.entries(X_Filter_Multiple).forEach(([key, placeholder]) => {
        let fieldValue;
        if (typeof placeholder === 'string' && placeholder.startsWith('##') && placeholder.endsWith('##')) {
          const formKey = placeholder.slice(2, -2);
          if (key === 'OTP') {
            fieldValue = otpValue;
          } else {
            fieldValue = isOld ? oldValue : newValue;
          }
        } else {
          fieldValue = placeholder;
        }
        xFilterMultiple += `<${key}>${fieldValue}</${key}>`;
      });

      const jUi = Object.entries(J_Ui).map(([key, val]) => `"${key}":"${val}"`).join(',');
      const jApi = Object.entries(J_Api).map(([key, val]) => `"${key}":"${val}"`).join(',');

      const xmlData = `<dsXml>
        <J_Ui>${jUi}</J_Ui>
        <X_Filter_Multiple>${xFilterMultiple}</X_Filter_Multiple>
        <J_Api>${jApi}</J_Api>
      </dsXml>`;

      const response = await axios.post(BASE_URL + PATH_URL, xmlData, {
        headers: {
          'Content-Type': 'application/xml',
          'Authorization': `Bearer ${document.cookie.split('auth_token=')[1]}`
        }
      });

      const responseData = response.data?.data?.rs0?.[0]?.Column1;
      if (responseData?.includes("<Flag>S</Flag>")) {
        toast.success(`${isOld ? 'Old' : 'New'} ${type} verified successfully!`);
        
        if (isOld && needsNewVerification) {
          setCurrentStep('new');
        } else {
          onSuccess(newValue || oldValue);
          onClose();
        }
      } else {
        const errorMatch = responseData?.match(/<Message>(.*?)<\/Message>/);
        setError(errorMatch ? errorMatch[1] : 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'old' && needsNewVerification) {
      setCurrentStep('new');
    } else {
      onSuccess(newValue || oldValue);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {type === 'email' ? 'Email' : 'Mobile'} Verification
        </h2>
        
        {/* Stepper indicator */}
        <div className="flex justify-between mb-6">
          <div className={`flex flex-col items-center ${currentStep === 'old' ? 'text-blue-500' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'old' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-xs mt-1">Verify Old</span>
          </div>
          
          {needsNewVerification && (
            <div className={`flex flex-col items-center ${currentStep === 'new' ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-xs mt-1">Verify New</span>
            </div>
          )}
          
          <div className={`flex flex-col items-center ${currentStep === 'complete' ? 'text-blue-500' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'complete' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {needsNewVerification ? 3 : 2}
            </div>
            <span className="text-xs mt-1">Complete</span>
          </div>
        </div>

        {/* Step 1: Old Value Verification */}
        {currentStep === 'old' && needsOldVerification && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Current {type === 'email' ? 'Email' : 'Mobile'}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={oldValue}
                readOnly
              />
            </div>
            
            {otpSent.old ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Enter OTP sent to {oldValue}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={oldOtp}
                  onChange={(e) => setOldOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
              </div>
            ) : (
              <button
                onClick={() => handleSendOtp(oldValue, true)}
                className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send OTP to Old'}
              </button>
            )}
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md"
                disabled={isLoading}
              >
                Cancel
              </button>
              {otpSent.old && (
                <button
                  onClick={() => handleVerifyOtp(oldOtp, true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  disabled={isLoading || !oldOtp}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: New Value Verification */}
        {currentStep === 'new' && needsNewVerification && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                New {type === 'email' ? 'Email' : 'Mobile'}
              </label>
              <input
                type={type === 'email' ? 'email' : 'tel'}
                className="w-full px-3 py-2 border rounded-md"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Enter new ${type}`}
              />
            </div>
            
            {otpSent.new ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Enter OTP sent to {newValue}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
              </div>
            ) : (
              <button
                onClick={() => handleSendOtp(newValue, false)}
                className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                disabled={isLoading || !newValue}
              >
                {isLoading ? 'Sending...' : 'Send OTP to New'}
              </button>
            )}
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCurrentStep('old')}
                className="px-4 py-2 border rounded-md"
                disabled={isLoading}
              >
                Back
              </button>
              {otpSent.new && (
                <button
                  onClick={() => handleVerifyOtp(newOtp, false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  disabled={isLoading || !newOtp}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completion Step (if needed) */}
        {currentStep === 'complete' && (
          <div>
            <p className="mb-4">Verification completed successfully!</p>
            <div className="flex justify-end">
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationModal;