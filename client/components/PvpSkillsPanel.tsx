import React from 'react';
import type { Player, GameData } from '../types';

interface PvpSkillsPanelProps {
    player: Player;
    onLearnSkill: (skillId: string) => Promise<boolean | void>;
    onEquipSkill: (skillId: string) => Promise<boolean | void>;
    gameData: GameData;
}

const PvpSkillsPanel: React.FC<PvpSkillsPanelProps> = ({ player, onLearnSkill, onEquipSkill, gameData }) => {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex-shrink-0 text-center">
                <h3 className="text-md font-semibold text-emerald-400">Điểm Vinh Dự Hiện Có</h3>
                <p className="text-3xl font-bold text-red-400 mt-1">{player.honorPoints}</p>
            </div>
            
            <div className="flex-grow bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col min-h-0">
                <h3 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Danh Sách Tuyệt Kỹ</h3>
                <div className="overflow-y-auto pr-2 space-y-3 flex-grow scrollbar-main">
                    {gameData.PVP_SKILLS.map(skill => {
                        const hasLearned = player.learned_pvp_skills.includes(skill.id);
                        const isEquipped = player.equipped_pvp_skill_id === skill.id;
                        const canAfford = player.honorPoints >= skill.cost;
                        const canLearn = !hasLearned && canAfford;

                        return (
                            <div key={skill.id} className={`bg-slate-800/60 p-3 rounded-lg transition-colors duration-200 ${isEquipped ? 'border-l-4 border-cyan-400' : ''}`}>
                                <h4 className="font-bold text-cyan-400">{skill.name}</h4>
                                <p className="text-xs text-slate-400 mt-1 italic">{skill.description}</p>
                                <p className="text-xs text-purple-400 mt-2 font-semibold">Tốn {skill.energy_cost} Sát Khí</p>
                                
                                <div className="mt-3 flex justify-between items-center">
                                    <span className={`text-sm font-bold ${canAfford || hasLearned ? 'text-red-400' : 'text-gray-500'}`}>
                                        {hasLearned ? 'Đã lĩnh ngộ' : `${skill.cost} điểm vinh dự`}
                                    </span>
                                    
                                    {hasLearned ? (
                                        <button
                                            onClick={() => onEquipSkill(skill.id)}
                                            className={`px-4 py-1 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out text-white focus:outline-none focus:ring-4 focus:ring-opacity-50 ${isEquipped ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-400/50' : 'bg-green-600 hover:bg-green-700 focus:ring-green-400/50'}`}
                                        >
                                            {isEquipped ? 'Tháo Ra' : 'Trang Bị'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onLearnSkill(skill.id)}
                                            disabled={!canLearn}
                                            className="px-4 py-1 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-400/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                           Lĩnh Ngộ
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PvpSkillsPanel;