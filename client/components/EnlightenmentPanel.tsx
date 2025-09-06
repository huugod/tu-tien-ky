import React from 'react';
import type { Player, InsightBonus, GameData } from '../types';

interface EnlightenmentPanelProps {
  player: Player;
  onUnlockInsight: (insightId: string) => void;
  gameData: GameData;
}

const formatBonus = (bonus: InsightBonus): string => {
    switch (bonus.type) {
        case 'qi_per_second_base_add': {
            const sign = bonus.value >= 0 ? '+' : '';
            return `Tốc độ tu luyện cơ bản ${sign}${bonus.value.toFixed(1)}`;
        }
        case 'body_temper_eff_add': {
            const percent = bonus.value * 100;
            const sign = percent >= 0 ? '+' : '';
            return `Hiệu quả Luyện Thể ${sign}${percent.toFixed(0)}%`;
        }
        case 'alchemy_success_base_add': {
            const percent = bonus.value * 100;
            const sign = percent >= 0 ? '+' : '';
            return `Tỷ lệ Luyện Đan cơ bản ${sign}${percent.toFixed(0)}%`;
        }
        default:
            return 'Hiệu ứng không xác định';
    }
};

const EnlightenmentPanel: React.FC<EnlightenmentPanelProps> = ({ player, onUnlockInsight, gameData }) => {
    return (
        <div className="flex flex-col space-y-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex-shrink-0 text-center">
                <h3 className="text-md font-semibold text-emerald-400">Điểm Lĩnh Ngộ</h3>
                <p className="text-3xl font-bold text-rose-400 mt-1">{player.enlightenmentPoints}</p>
                 <p className="text-xs text-slate-400 mt-1">Nhận được khi đột phá cảnh giới thành công.</p>
            </div>

            <div className="flex-grow bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col min-h-0">
                <h3 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Thiên Phú</h3>
                <div className="overflow-y-auto pr-2 space-y-3 scrollbar-main">
                   {gameData.INSIGHTS.map(insight => {
                        const isUnlocked = player.unlockedInsights.includes(insight.id);
                        const canAfford = player.enlightenmentPoints >= insight.cost;
                        const prereqsMet = insight.requiredInsightIds.every(reqId => player.unlockedInsights.includes(reqId));
                        const canUnlock = !isUnlocked && canAfford && prereqsMet;

                        return (
                             <div key={insight.id} className={`bg-slate-800/60 p-3 rounded-lg transition-opacity duration-300 ${isUnlocked ? 'border-l-4 border-amber-400' : ''} ${!prereqsMet && !isUnlocked ? 'opacity-50' : ''}`}>
                                <h4 className="font-bold text-cyan-400">{insight.name}</h4>
                                <p className="text-xs text-slate-400 mt-1 italic">{insight.description}</p>
                                <p className="text-xs font-semibold text-amber-300 mt-2">{formatBonus(insight.bonus)}</p>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className={`text-sm font-bold ${canAfford ? 'text-rose-400' : 'text-red-500'}`}>
                                        {insight.cost} điểm
                                    </span>
                                    <button
                                        onClick={() => onUnlockInsight(insight.id)}
                                        disabled={!canUnlock}
                                        className="px-4 py-1 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-400/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUnlocked ? 'Đã Lĩnh Ngộ' : 'Lĩnh Ngộ'}
                                    </button>
                                </div>
                                {insight.requiredInsightIds.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-2 border-t border-slate-700 pt-1">
                                        Yêu cầu: {insight.requiredInsightIds.map(id => gameData.INSIGHTS.find(i=>i.id === id)?.name).join(', ')}
                                    </p>
                                )}
                             </div>
                        )
                   })}
                </div>
            </div>
        </div>
    );
};

export default EnlightenmentPanel;