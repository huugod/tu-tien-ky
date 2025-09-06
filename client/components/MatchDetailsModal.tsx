import React from 'react';

// This type definition is local to this component, based on its usage in GuildWarPanel.
interface SimpleMatch {
    id: number;
    summary: string;
    log: string[];
}

interface MatchDetailsModalProps {
    match: SimpleMatch;
    onClose: () => void;
}

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
    if (!match) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-4 border-b border-slate-600 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-cyan-300">Chi Tiết Trận Đấu</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                <div className="p-4 flex-shrink-0">
                    <p className="text-lg text-slate-300 mb-2">{match.summary}</p>
                </div>
                <div className="flex-grow p-4 overflow-y-auto bg-slate-900/50 scrollbar-modal">
                    <ul className="space-y-2 text-sm">
                        {match.log.map((entry, index) => (
                            <li key={index} className="text-slate-300">
                                {entry}
                            </li>
                        ))}
                         {match.log.length === 0 && <li className="text-slate-500 italic">Không có chi tiết chiến đấu.</li>}
                    </ul>
                </div>
                <footer className="flex-shrink-0 p-4 border-t border-slate-600 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Đóng</button>
                </footer>
            </div>
        </div>
    );
};

export default MatchDetailsModal;