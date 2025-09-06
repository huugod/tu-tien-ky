import React from 'react';
import type { Player, GameData, Avatar } from '../types';

interface AvatarSelectionModalProps {
    player: Player;
    gameData: GameData;
    onClose: () => void;
    onSelectAvatar: (avatarId: string) => void;
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ player, gameData, onClose, onSelectAvatar }) => {
    
    const unlockedAvatars: Avatar[] = player.unlocked_avatars
        .map(id => gameData.AVATARS.find(avatar => avatar.id === id))
        .filter((avatar): avatar is Avatar => avatar !== undefined);

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
                    <h2 className="text-2xl font-semibold text-cyan-300">Thay Đổi Pháp Tướng</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto scrollbar-modal">
                    {unlockedAvatars.length === 0 ? (
                        <p className="text-center text-slate-400">Bạn chưa sở hữu Pháp Tướng nào.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {unlockedAvatars.map(avatar => {
                                const isEquipped = player.equipped_avatar_id === avatar.id;
                                return (
                                    <div key={avatar.id} className="flex flex-col items-center">
                                        <button
                                            onClick={() => onSelectAvatar(avatar.id)}
                                            className={`w-24 h-24 rounded-lg overflow-hidden border-4 transition-all duration-200 ${
                                                isEquipped ? 'border-cyan-400 shadow-lg' : 'border-slate-600 hover:border-slate-400'
                                            }`}
                                        >
                                            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                                        </button>
                                        <p className="text-xs text-center mt-2 text-slate-300">{avatar.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AvatarSelectionModal;