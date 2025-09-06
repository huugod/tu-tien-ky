import React, { useState, useEffect } from 'react';
import type { Player, TechniqueBonus, GameData } from '../types';
import { formatBonus } from '../constants';

interface TechniquesPanelProps {
  player: Player;
  onActivateTechnique: (techniqueId: string) => void;
  gameData: GameData;
}

const TechniquesPanel: React.FC<TechniquesPanelProps> = ({ player, onActivateTechnique, gameData }) => {
    const [cooldown, setCooldown] = useState<number>(0);

    useEffect(() => {
        const timer = setInterval(() => {
            const cooldownConfig = gameData.TECHNIQUE_SWITCH_COOLDOWN_SECONDS;
            if (cooldownConfig && player.last_technique_switch_time) {
                const cooldownSeconds = cooldownConfig.value || 60;
                const lastSwitch = new Date(player.last_technique_switch_time).getTime();
                const now = Date.now();
                const secondsSinceLastSwitch = (now - lastSwitch) / 1000;
                const timeLeft = Math.max(0, Math.ceil(cooldownSeconds - secondsSinceLastSwitch));
                setCooldown(timeLeft);
            } else {
                setCooldown(0);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [player.last_technique_switch_time, gameData.TECHNIQUE_SWITCH_COOLDOWN_SECONDS]);

    const availableTechniques = gameData.TECHNIQUES.filter(tech => player.realmIndex >= tech.requiredRealmIndex);

  if (availableTechniques.length === 0) {
    return <div className="text-center text-slate-500 h-full flex items-center justify-center">Chưa có công pháp nào để lĩnh ngộ. Hãy đột phá cảnh giới cao hơn.</div>
  }

  const isGlobalCooldown = cooldown > 0;

  return (
    <div className="flex flex-col space-y-4 h-full overflow-y-auto pr-2 scrollbar-main">
        {availableTechniques.map(tech => {
            const isActive = player.activeTechniqueId === tech.id;
            return (
                <div key={tech.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="font-bold text-lg text-emerald-400">{tech.name}</h3>
                    <p className="text-sm text-slate-400 mt-1 italic">{tech.description}</p>
                    <div className="mt-2 text-xs space-y-1">
                        {tech.bonuses.map((bonus, index) => (
                           <p key={index} className="text-cyan-300">{formatBonus(bonus)}</p>
                        ))}
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => onActivateTechnique(tech.id)}
                            disabled={isGlobalCooldown}
                            className={`w-full px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                                isActive 
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-400' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400'
                            } disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isGlobalCooldown ? `Hồi (${cooldown}s)` : (isActive ? 'Ngừng Vận Chuyển' : 'Vận Chuyển')}
                        </button>
                    </div>
                </div>
            )
        })}
    </div>
  );
};

export default TechniquesPanel;