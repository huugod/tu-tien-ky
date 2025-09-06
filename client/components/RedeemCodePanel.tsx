import React, { useState } from 'react';

interface RedeemCodePanelProps {
    onRedeemCode: (code: string) => Promise<boolean | void>;
}

const RedeemCodePanel: React.FC<RedeemCodePanelProps> = ({ onRedeemCode }) => {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        const success = await onRedeemCode(code.trim());
        if (success) {
            setCode(''); // Clear input on success
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex-shrink-0">
            <h3 className="text-md font-semibold text-emerald-400">Đổi Lễ Bao</h3>
            <p className="text-xs text-slate-400 mt-1">
                Nhập mã quà tặng để nhận những phần thưởng giá trị.
            </p>
            <form onSubmit={handleSubmit} className="flex space-x-2 mt-3">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="NHẬP MÃ TẠI ĐÂY"
                    className="flex-grow bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-slate-500 text-center"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!code.trim() || isSubmitting}
                    className="px-6 py-2 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-400/50 disabled:bg-slate-600 disabled:opacity-50"
                >
                    {isSubmitting ? '...' : 'Đổi'}
                </button>
            </form>
        </div>
    );
};

export default RedeemCodePanel;