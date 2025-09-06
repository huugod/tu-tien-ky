import React from 'react';
import type { Player, GameData } from '../types';
import { formatNumber, getRarityStyle, formatPillEffectDescription } from '../constants';

interface AlchemyPanelProps {
    player: Player;
    onCraftPill: (recipeId: string) => void;
    gameData: GameData;
}

const AlchemyPanel: React.FC<AlchemyPanelProps> = ({ player, onCraftPill, gameData }) => {
    
    const canCraft = (recipeId: string): boolean => {
        const recipe = gameData.RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;
        if (player.realmIndex < recipe.requiredRealmIndex) return false;
        if (player.qi < recipe.qiCost) return false;
        for (const herbId in recipe.herbCosts) {
            if ((player.herbs[herbId] || 0) < recipe.herbCosts[herbId]) {
                return false;
            }
        }
        return true;
    };

    const DefaultIcon = () => (
        <div className="w-10 h-10 bg-slate-700 rounded-md flex items-center justify-center text-slate-500">
            ?
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col min-h-0 h-full">
                <h3 className="text-md font-semibold text-emerald-400 mb-2">Đan Phương</h3>
                <div className="overflow-y-auto pr-2 space-y-3 scrollbar-main">
                    {gameData.RECIPES.map(recipe => {
                         const meetsRealmReq = player.realmIndex >= recipe.requiredRealmIndex;
                         const isCraftable = canCraft(recipe.id);
                         const pill = gameData.PILLS.find(p => p.id === recipe.pillId);
                         const { style: rarityStyle, className: rarityClassName } = getRarityStyle(pill?.rarity, gameData.RARITIES);

                         return (
                            <div key={recipe.id} className={`bg-slate-800/60 p-3 rounded-lg ${!meetsRealmReq ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {pill?.icon_url ? (
                                            <img src={pill.icon_url} alt={pill.name} className="w-12 h-12" />
                                        ) : <DefaultIcon />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-cyan-400">{recipe.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 italic">Luyện ra: <span style={rarityStyle} className={`font-semibold ${rarityClassName || ''}`}>{pill?.name}</span></p>
                                    </div>
                                </div>
                                {pill?.effect.map((eff, i) => (
                                    <p key={i} className="text-xs text-amber-300 mt-1">└ {formatPillEffectDescription(eff)}</p>
                                ))}
                                <div className="text-xs text-slate-500 mt-2 space-y-1">
                                     <p>Yêu cầu: {gameData.REALMS[recipe.requiredRealmIndex].name}</p>
                                     <p>Linh khí: {formatNumber(recipe.qiCost)}</p>
                                     {Object.entries(recipe.herbCosts).map(([herbId, amount]) => {
                                         const herb = gameData.HERBS.find(h => h.id === herbId);
                                         const playerAmount = player.herbs[herbId] || 0;
                                         const hasEnough = playerAmount >= amount;
                                         return (
                                            <div key={herbId} className={`flex items-center gap-2 ${hasEnough ? '' : 'text-red-400'}`}>
                                                {herb?.icon_url ? <img src={herb.icon_url} alt={herb.name} className="w-5 h-5" /> : <div className="w-5 h-5 bg-slate-700 rounded-sm" />}
                                                <span>{herb?.name}: {playerAmount}/{amount}</span>
                                            </div>
                                         )
                                     })}
                                </div>
                                <button
                                    onClick={() => onCraftPill(recipe.id)}
                                    disabled={!isCraftable}
                                    className="w-full mt-3 px-4 py-1 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-400/50 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Luyện (T.công: {recipe.successChance * 100}%)
                                </button>
                            </div>
                         )
                    })}
                </div>
            </div>
        </div>
    )
}

export default AlchemyPanel;