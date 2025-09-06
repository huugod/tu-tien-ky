import React, { useState, useEffect } from 'react';
import type { Player, GameEvent, TrialZone, Reward, GameData } from '../types';
import { formatNumber, getRarityStyle } from '../constants';
import { API_BASE_URL } from '../config/config';

interface TrialGroundsPanelProps {
    player: Player;
    token: string | null;
    lastChallengeTime: { [key: string]: number };
    onChallengeResult: (data: any) => void;
    addEvent: (message: string, type: GameEvent['type']) => void;
    gameData: GameData;
}

const renderReward = (reward: Reward, gameData: GameData, key: number) => {
    let text = '';
    let item: { rarity?: string, name?: string } | null = null;
    switch (reward.type) {
        case 'qi': 
            text = `${formatNumber(reward.amount)} Linh Khí`;
            break;
        case 'herb':
            const herb = gameData.HERBS.find(h => h.id === reward.herbId);
            text = `${herb?.name} x${reward.amount}`;
            break;
        case 'equipment':
            item = gameData.EQUIPMENT.find(e => e.id === reward.equipmentId) ?? null;
            text = `[${item?.name}]`;
            break;
        case 'linh_thach': 
            text = `${formatNumber(reward.amount)} Linh Thạch`;
            break;
        case 'merit': 
            text = `${reward.amount} Công Đức`;
            break;
        default: 
            return null;
    }
    const { style: rarityStyle, className: rarityClassName } = getRarityStyle(item?.rarity, gameData.RARITIES);
    return <span key={key} style={rarityStyle} className={rarityClassName}>{text}</span>;
};

const TrialGroundsPanel: React.FC<TrialGroundsPanelProps> = ({ player, token, lastChallengeTime, onChallengeResult, addEvent, gameData }) => {
    const [isFighting, setIsFighting] = useState<string | null>(null); // Store the ID of the zone being fought
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleChallenge = async (zone: TrialZone) => {
        if (!token || isFighting) return;
        
        setIsFighting(zone.id);
        addEvent(`Bắt đầu khiêu chiến ${zone.name}...`, 'info');

        try {
            const response = await fetch(`${API_BASE_URL}/challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ zoneId: zone.id }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Khiêu chiến thất bại.');
            }
            onChallengeResult(data);
        } catch (err) {
            addEvent((err as Error).message, 'danger');
        } finally {
            setIsFighting(null);
        }
    };
    
    const renderCooldownTimer = (zoneId: string, cooldownSeconds: number) => {
        const lastTime = lastChallengeTime[zoneId] || 0;
        const endTime = lastTime + cooldownSeconds * 1000;
        const timeLeft = Math.max(0, Math.floor((endTime - time) / 1000));

        if (timeLeft <= 0) return null;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `(${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
    };

    return (
        <div className="flex flex-col space-y-4 h-full overflow-y-auto scrollbar-main p-1">
            {gameData.TRIAL_ZONES.map(zone => {
                const canChallenge = player.realmIndex >= zone.requiredRealmIndex;
                const lastTime = lastChallengeTime[zone.id] || 0;
                const onCooldown = (time - lastTime) < zone.cooldownSeconds * 1000;
                const cooldownTimer = renderCooldownTimer(zone.id, zone.cooldownSeconds);
                const isMeritZone = zone.type === 'MERIT';

                return (
                    <div key={zone.id} className={`bg-slate-900/50 p-3 rounded-lg border ${isMeritZone ? 'border-cyan-700' : 'border-slate-700'}`}>
                        <h4 className={`font-bold text-md ${isMeritZone ? 'text-cyan-300' : 'text-emerald-400'}`}>
                            {zone.name.replace(' (Trảm Yêu)', '')} 
                            {isMeritZone && <span className="text-xs ml-2 py-0.5 px-1.5 bg-cyan-800 rounded">Trảm Yêu</span>}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 italic">{zone.description}</p>
                         <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-baseline gap-x-1.5">
                            <span>Phần thưởng:</span>
                            {zone.rewards.map((r, i) => (
                                <React.Fragment key={i}>
                                    {renderReward(r, gameData, i)}
                                    {i < zone.rewards.length - 1 && <span>,</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Yêu cầu: Tu vi [{gameData.REALMS[zone.requiredRealmIndex].name}]
                        </p>
                        <div className="mt-3">
                            <button
                                onClick={() => handleChallenge(zone)}
                                disabled={!canChallenge || isFighting !== null || onCooldown}
                                className="w-full px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-red-700 hover:bg-red-800 text-white focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isFighting === zone.id ? 'Đang chiến đấu...' : `Khiêu Chiến ${cooldownTimer || ''}`}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TrialGroundsPanel;