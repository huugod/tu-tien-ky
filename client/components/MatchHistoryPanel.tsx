import React, { useState, useEffect, useCallback } from 'react';
import type { MatchHistoryItem, CombatLogEntry } from '../types';
import CombatReplayModal from './CombatReplayModal'; // UPDATED: Use the new replay modal

const API_BASE_URL = '/api';

interface MatchHistoryPanelProps {
  token: string | null;
  playerName: string;
}

const MatchHistoryPanel: React.FC<MatchHistoryPanelProps> = ({ token, playerName }) => {
    const [history, setHistory] = useState<MatchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMatchLog, setSelectedMatchLog] = useState<CombatLogEntry[] | null>(null);
    const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/pvp/history`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Không thể tải lịch sử đấu.');
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (isLoading) {
        return <div className="text-center text-slate-400">Đang tải lịch sử...</div>;
    }
    
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-center">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchHistory}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const handleViewReplay = (match: MatchHistoryItem) => {
        setSelectedMatchLog(match.log);
        setSelectedOpponent(match.opponent);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold text-cyan-300 border-b-2 border-slate-700 pb-2 mb-2 flex-shrink-0">Lịch Sử Đấu Pháp</h2>
            <div className="overflow-y-auto flex-grow pr-2 scrollbar-chat">
                <ul className="space-y-2">
                    {history.length === 0 && (
                        <p className="text-center text-slate-500 pt-8">Lịch sử trống. Hãy đi tìm đối thủ luận bàn!</p>
                    )}
                    {history.map((match) => (
                        <li key={match.id} className="text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className={`font-bold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
                                        {match.won ? 'Thắng' : 'Thua'}
                                    </span>
                                    <span className="text-slate-400"> vs </span>
                                    <span className="font-semibold text-white">{match.opponent}</span>
                                </div>
                                <button 
                                    onClick={() => handleViewReplay(match)}
                                    className="px-2 py-1 text-xs font-bold rounded-lg shadow-md transition-all duration-300 bg-slate-600 hover:bg-slate-500 text-white"
                                >
                                    Xem Lại
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 italic mt-1">"{match.summary}"</p>
                            <p className="text-right text-xs text-slate-500 mt-1">
                                {new Date(match.timestamp).toLocaleString('vi-VN')}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
            {selectedMatchLog && selectedOpponent && (
                <CombatReplayModal
                    log={selectedMatchLog}
                    player1Name={playerName}
                    player2Name={selectedOpponent}
                    onClose={() => setSelectedMatchLog(null)}
                />
            )}
        </div>
    );
};

export default MatchHistoryPanel;