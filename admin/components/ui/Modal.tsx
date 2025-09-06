import { FC, ReactNode } from 'react';

interface ModalProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
}
const Modal: FC<ModalProps> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex justify-between items-center p-4 border-b border-slate-600 flex-shrink-0">
                <h2 className="text-2xl font-semibold text-cyan-300">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
            </header>
            <main className="p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
);

export default Modal;