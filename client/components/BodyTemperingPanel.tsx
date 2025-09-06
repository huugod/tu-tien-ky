import React, { useState, useEffect } from 'react';
import type { Player, ExplorationLocation, GameData, Reward } from '../types';
import { BODY_STRENGTH_COST, formatNumber, getRarityStyle } from '../constants';

interface BodyTemperingPanelProps {
  player: Player;
  onTemperBody: () => void;
  onStartExploration: (location: ExplorationLocation) => void;
  explorationStatus: { locationId: string; endTime: number; } | null;
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

const BodyTemperingPanel: React.FC<BodyTemperingPanelProps> = ({ player, onTemperBody, onStartExploration, explorationStatus, gameData }) => {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const temperCost = Math.floor(BODY_STRENGTH_COST.base * Math.pow(BODY_STRENGTH_COST.multiplier, player.bodyStrength));
  const canTemper = player.qi >= temperCost;

  const renderExplorationTimer = (endTime: number) => {
    const timeLeft = Math.max(0, Math.floor((endTime - time) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-cyan-300">Tôi Luyện Thân Thể</h3>
        <p className="text-sm text-slate-400 mt-1">Dùng linh khí để cường hóa nhục thân, mở ra tiềm năng vô tận.</p>
        <button
          onClick={onTemperBody}
          disabled={!canTemper}
          className="w-full mt-3 px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-amber-600 hover:bg-amber-700 text-white focus:outline-none focus:ring-4 focus:ring-amber-400/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Luyện Thể (Cần {formatNumber(temperCost)} Linh Khí)
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-cyan-300">Thám Hiểm Bí Cảnh</h3>
        <div className="space-y-4 mt-2">
          {gameData.EXPLORATION_LOCATIONS.map(location => {
            const canExplore = player.realmIndex >= location.requiredRealmIndex && player.bodyStrength >= location.requiredBodyStrength;
            const isExploringThis = explorationStatus?.locationId === location.id;

            return (
              <div key={location.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h4 className="font-bold text-md text-emerald-400">{location.name}</h4>
                <p className="text-xs text-slate-400 mt-1 italic">{location.description}</p>
                 <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-baseline gap-x-1.5">
                  <span>Phần thưởng:</span>
                   {location.rewards.map((r, i) => (
                        <React.Fragment key={i}>
                            {renderReward(r, gameData, i)}
                            {i < location.rewards.length - 1 && <span>,</span>}
                        </React.Fragment>
                    ))}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Yêu cầu: Tu vi [{gameData.REALMS[location.requiredRealmIndex].name}], Thân thể [{location.requiredBodyStrength}]
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => onStartExploration(location)}
                    disabled={!canExplore || explorationStatus !== null}
                    className="w-full px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-indigo-400/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExploringThis 
                      ? `Đang thám hiểm... (${renderExplorationTimer(explorationStatus.endTime)})`
                      : `Bắt đầu (${Math.floor(location.durationSeconds / 60)} phút)`
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BodyTemperingPanel;
