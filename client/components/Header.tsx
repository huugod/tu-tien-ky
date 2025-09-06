import React from 'react';
import type { Player, GameData } from '../types';
import { formatNumber } from '../constants';

interface HeaderProps {
    player: Player;
    gameData: GameData;
    avatarUrl: string | undefined;
    onOpenStats: () => void;
}

const Header: React.FC<HeaderProps> = ({ player, gameData, avatarUrl, onOpenStats }) => {
    const realm = gameData.REALMS[player.realmIndex];
    
    return (
        <header className="flex-shrink-0 w-full max-w-5xl mx-auto flex justify-between items-center p-2 bg-slate-900/30 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="text-left">
                <h1 className="text-xl md:text-2xl font-bold text-cyan-300 font-cinzel" style={{ textShadow: '0 0 8px rgba(0, 224, 255, 0.6), 0 0 16px rgba(0, 224, 255, 0.4)' }}>
                    Tu Tiên Ký
                </h1>
                <p className="text-slate-400 text-xs italic hidden sm:block">Hư Vô Lộ</p>
            </div>
            
            <div className="text-center bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-1 hidden sm:block">
                <span className="text-xs text-amber-300 uppercase tracking-wider">Lực Chiến</span>
                <p className="text-xl font-bold text-amber-400" style={{ textShadow: '0 0 5px rgba(251, 191, 36, 0.5)' }}>
                    {/* FIX: Convert combat_power to number before formatting to fix type error. */}
                    {formatNumber(Number(player.combat_power))}
                </p>
            </div>

            <div onClick={onOpenStats} className="flex items-center space-x-3 cursor-pointer p-1 pr-2 rounded-full hover:bg-slate-700/50 transition-colors">
                <div className="text-right">
                    <h2 className="text-lg font-bold text-white leading-tight">{player.name}</h2>
                    <p className="text-xs text-emerald-400">{realm?.name}</p>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-500 flex-shrink-0">
                    {avatarUrl && <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
                </div>
            </div>
        </header>
    );
};

export default Header;