const SaveConfirmationModal: React.FC<
{ 
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    confirmationHeading: string;
    confirmationMessage: string;
    cancelText: string;
    confirmText: string;
}> = ({ isOpen, onConfirm, onCancel, confirmationHeading = "Please Confirm", confirmationMessage = "Are you sure you want to proceed?", cancelText = "Cancel", confirmText = "Confirm" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-[400px]">
                <h4 className="text-xl font-semibold mb-4">{confirmationHeading}</h4>
                <p className="text-gray-600 mb-6">{confirmationMessage}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveConfirmationModal;