import React, { useState, useEffect, useCallback } from 'react';
import type { Player, GameEvent, GameData, CombatLogEntry } from '../types';
import HonorShopPanel from './HonorShopPanel'; 
import MatchHistoryPanel from './MatchHistoryPanel'; 
import PvpSkillsPanel from './PvpSkillsPanel'; // NEW: Import the new panel
import CombatReplayModal from './CombatReplayModal'; // NEW: Import the replay modal
import { API_BASE_URL } from '../config/config';

interface Opponent {
    name: string;
    realmIndex: number;
    pvp_elo: number;
}

interface PvpPanelProps {
    player: Player;
    token: string | null;
    lastChallengeTime: { [key: string]: number };
    onChallengeResult: (data: any) => void;
    addEvent: (message: string, type: GameEvent['type']) => void;
    onBuyHonorItem: (itemId: string) => Promise<boolean | void>;
    onLearnPvpSkill: (skillId: string) => Promise<boolean | void>;
    onEquipPvpSkill: (skillId: string) => Promise<boolean | void>;
    gameData: GameData;
}

const FindOpponentPanel: React.FC<PvpPanelProps & { onCombatReplay: (log: CombatLogEntry[], opponent: Opponent) => void; }> = ({ token, lastChallengeTime, onChallengeResult, addEvent, gameData, onCombatReplay }) => {
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFighting, setIsFighting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [time, setTime] = useState(Date.now());
    
    useEffect(() => {
        const timer = setInterval(() => setTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const pvpCooldownSeconds = gameData.PVP_COOLDOWN_SECONDS?.value || 300;
    const lastPvpTime = lastChallengeTime['pvp'] || 0;
    const onCooldown = (time - lastPvpTime) < pvpCooldownSeconds * 1000;
    
    const fetchOpponents = useCallback(async () => {
        if (!token || onCooldown) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/pvp/opponents`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.message || 'Không thể tìm thấy đối thủ.');
            }
            const data = await response.json();
            setOpponents(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token, onCooldown]);
    
    useEffect(() => {
        if (!onCooldown) {
            fetchOpponents();
        }
    }, [fetchOpponents, onCooldown]);

    const handleChallenge = async (opponent: Opponent) => {
        if (!token || isFighting || onCooldown) return;
        
        setIsFighting(true);
        addEvent(`Bắt đầu luận bàn cùng đạo hữu ${opponent.name}...`, 'info');

        try {
            const response = await fetch(`${API_BASE_URL}/pvp/challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ opponentName: opponent.name }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Khiêu chiến thất bại.');
            }
            // NEW: Instead of just processing, check for the structured log and trigger the replay
            if (data.structuredCombatLog) {
                onCombatReplay(data.structuredCombatLog, opponent);
            }
            onChallengeResult(data);
            fetchOpponents();
        } catch (err) {
            addEvent((err as Error).message, 'danger');
        } finally {
            setIsFighting(false);
        }
    };
    
    const renderCooldownTimer = () => {
        const endTime = lastPvpTime + pvpCooldownSeconds * 1000;
        const timeLeft = Math.max(0, Math.floor((endTime - time) / 1000));
        if (timeLeft <= 0) return null;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `Thời gian hồi: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="text-center">
                <button
                    onClick={fetchOpponents}
                    disabled={isLoading || isFighting || onCooldown}
                    className="px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-4 focus:ring-indigo-400/50 disabled:bg-slate-600 disabled:opacity-50"
                >
                    Tìm Đối Thủ
                </button>
                {onCooldown && <p className="text-xs text-yellow-400 mt-2">{renderCooldownTimer()}</p>}
            </div>

            <div className="flex-grow bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col min-h-0">
                <div className="overflow-y-auto pr-2 space-y-3 flex-grow scrollbar-main">
                     {isLoading && <p className="text-center text-slate-400">Đang tìm kiếm đạo hữu...</p>}
                     {error && <p className="text-center text-red-400">{error}</p>}
                     {!isLoading && !error && opponents.length === 0 && !onCooldown && <p className="text-center text-slate-500">Không tìm thấy đối thủ nào phù hợp. Hãy thử lại.</p>}
                     
                     {opponents.map(opp => (
                        <div key={opp.name} className="flex justify-between items-center bg-slate-800/60 p-3 rounded">
                            <div>
                                <p className="font-semibold text-white">{opp.name}</p>
                                <p className="text-xs text-emerald-400">{gameData.REALMS[opp.realmIndex]?.name || 'N/A'} ({opp.pvp_elo} Elo)</p>
                            </div>
                            <button
                                onClick={() => handleChallenge(opp)}
                                disabled={isFighting || onCooldown}
                                className="px-4 py-1 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-red-700 hover:bg-red-800 text-white focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:bg-slate-600 disabled:opacity-50 text-sm"
                            >
                                {isFighting ? '...' : 'Khiêu Chiến'}
                            </button>
                        </div>
                     ))}
                </div>
            </div>
        </div>
    );
};


const PvpPanel: React.FC<PvpPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'find' | 'skills' | 'shop' | 'history'>('find');
    const [activeCombatReplay, setActiveCombatReplay] = useState<{ log: CombatLogEntry[], opponent: Opponent } | null>(null);
    
    const getTabClass = (tabName: typeof activeTab) => {
        return `flex-1 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === tabName 
            ? 'text-cyan-300 border-b-2 border-cyan-400' 
            : 'text-slate-400 hover:text-white'
        }`;
    };

    const handleCombatReplay = (log: CombatLogEntry[], opponent: Opponent) => {
        setActiveCombatReplay({ log, opponent });
    };

    return (
        <div className="flex flex-col h-full">
            {activeCombatReplay && (
                <CombatReplayModal
                    log={activeCombatReplay.log}
                    player1Name={props.player.name}
                    player2Name={activeCombatReplay.opponent.name}
                    onClose={() => setActiveCombatReplay(null)}
                />
            )}
            
            <div className="p-3 text-center bg-slate-900/50 rounded-lg border border-slate-700 flex-shrink-0 mb-4">
                <h3 className="text-md font-semibold text-emerald-400">Điểm Elo Hiện Tại</h3>
                <p className="text-3xl font-bold text-amber-400 mt-1">{props.player.pvp_elo}</p>
            </div>

            <div className="flex flex-col flex-grow min-h-0">
                <div className="flex border-b border-slate-700 flex-shrink-0">
                    <button onClick={() => setActiveTab('find')} className={getTabClass('find')}>
                        Tìm Đối Thủ
                    </button>
                    <button onClick={() => setActiveTab('skills')} className={getTabClass('skills')}>
                        Tuyệt Kỹ
                    </button>
                    <button onClick={() => setActiveTab('shop')} className={getTabClass('shop')}>
                        Vinh Dự
                    </button>
                    <button onClick={() => setActiveTab('history')} className={getTabClass('history')}>
                        Lịch Sử
                    </button>
                </div>
                <div className="flex-grow min-h-0 pt-4">
                    {activeTab === 'find' && <FindOpponentPanel {...props} onCombatReplay={handleCombatReplay} />}
                    {activeTab === 'skills' && <PvpSkillsPanel player={props.player} onLearnSkill={props.onLearnPvpSkill} onEquipSkill={props.onEquipPvpSkill} gameData={props.gameData} />}
                    {activeTab === 'shop' && <HonorShopPanel player={props.player} onBuyItem={props.onBuyHonorItem} gameData={props.gameData} />}
                    {activeTab === 'history' && <MatchHistoryPanel token={props.token} playerName={props.player.name} />}
                </div>
            </div>
        </div>
    );
};

export default PvpPanel;