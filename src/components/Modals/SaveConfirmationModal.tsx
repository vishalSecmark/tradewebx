import React, { useId } from "react";
import AccessibleModal from "@/components/a11y/AccessibleModal";

type SaveConfirmationModalProps = {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    confirmationHeading: string;
    confirmationMessage: string;
    cancelText: string;
    confirmText: string;
};

const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    confirmationHeading = "Please Confirm",
    confirmationMessage = "Are you sure you want to proceed?",
    cancelText = "Cancel",
    confirmText = "Confirm"
}) => {
    const titleId = useId();
    const descriptionId = useId();

    return (
        <AccessibleModal
            isOpen={isOpen}
            onDismiss={onCancel}
            labelledBy={titleId}
            describedBy={descriptionId}
            role="alertdialog"
            className="bg-white p-6 shadow-theme-lg max-w-md w-full rounded-lg"
            closeOnOverlayClick={false}
        >
            <div>
                <h4 id={titleId} className="text-xl font-semibold mb-4">
                    {confirmationHeading}
                </h4>
                <p id={descriptionId} className="text-gray-600 mb-6">
                    {confirmationMessage}
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
};

export default SaveConfirmationModal;
