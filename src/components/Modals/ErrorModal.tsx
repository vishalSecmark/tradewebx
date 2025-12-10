import React, { useId } from 'react';
import { useTheme } from '@/context/ThemeContext';
import AccessibleModal from '@/components/a11y/AccessibleModal';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, message }) => {
    const { colors } = useTheme();
    const titleId = useId();
    const descriptionId = useId();

    return (
        <AccessibleModal
            isOpen={isOpen}
            onDismiss={onClose}
            labelledBy={titleId}
            describedBy={descriptionId}
            role="alertdialog"
            className="p-6 w-full max-w-lg mx-4 rounded-lg"
            closeOnOverlayClick={false}
        >
            <div
                className="rounded-lg"
                style={{ backgroundColor: colors.cardBackground || '#ffffff' }}
            >
                <div className="flex items-center mb-4 px-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3" aria-hidden="true">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h4
                        id={titleId}
                        className="text-xl font-semibold"
                        style={{ color: colors.text || '#000000' }}
                    >
                        Error
                    </h4>
                </div>

                <p
                    id={descriptionId}
                    className="text-gray-600 mb-6 leading-relaxed px-2"
                    style={{ color: colors.text || '#666666' }}
                >
                    {message}
                </p>

                <div className="flex justify-end px-2 pb-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-md font-medium transition-colors duration-200"
                        style={{
                            backgroundColor: colors.buttonBackground || '#3b82f6',
                            color: colors.buttonText || '#ffffff'
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
};

export default ErrorModal;
