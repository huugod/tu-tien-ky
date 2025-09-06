import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Xác Nhận',
    cancelText = 'Hủy Bỏ',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4"
            onClick={onCancel} // Close on overlay click
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg m-4 p-6"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">{title}</h2>
                <div className="text-slate-300 mb-8 whitespace-pre-wrap">{message}</div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-slate-600 hover:bg-slate-500 text-white focus:outline-none focus:ring-4 focus:ring-slate-400/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out text-white focus:outline-none focus:ring-4 focus:ring-opacity-50 ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;