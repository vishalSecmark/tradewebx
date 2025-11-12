import React, { useId } from "react";
import AccessibleModal from "@/components/a11y/AccessibleModal";

interface ValidationModalProps {
    isOpen: boolean;
    message: string;
    type: 'M' | 'S' | 'E' | 'D';
    onConfirm: () => void;
    onCancel?: () => void;
}

const CaseConfirmationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    message,
    type,
    onConfirm,
    onCancel
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const dismissHandler = type === 'M' ? onCancel : onConfirm;

    return (
        <AccessibleModal
            isOpen={isOpen}
            onDismiss={dismissHandler}
            labelledBy={titleId}
            describedBy={descriptionId}
            role={type === 'M' ? 'alertdialog' : 'dialog'}
            className="bg-white p-6 shadow-theme-lg max-w-md w-full rounded-lg"
            closeOnOverlayClick={type !== 'M'}
        >
            <div>
                <h4 id={titleId} className="text-xl font-semibold mb-4">
                    {type === 'M' ? 'Confirmation' : 'Message'}
                </h4>
                <p id={descriptionId} className="text-gray-600 mb-6">
                    {message}
                </p>
                <div className="flex justify-end gap-4">
                    {type === 'M' && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                        >
                            No
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`${type === 'M'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-green-500 hover:bg-green-600'
                            } text-white px-4 py-2 rounded-md`}
                    >
                        {type === 'M' ? 'Yes' : 'OK'}
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
};

export default CaseConfirmationModal;
