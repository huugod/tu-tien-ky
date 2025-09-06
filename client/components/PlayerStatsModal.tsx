import React, { useState } from 'react';
import type { Player, GameData, ActiveBuff } from '../types';
import { formatNumber, formatBonus } from '../constants';
import AvatarSelectionModal from './AvatarSelectionModal'; // NEW: Import avatar modal

interface PlayerStatsModalProps {
  player: Player;
  calculatedStats: any;
  gameData: GameData;
  onClose: () => void;
  onLogout: () => void;
  onEquipAvatar: (avatarId: string) => void; // NEW: Add callback for equipping avatar
}

const formatBuff = (buff: ActiveBuff): string => {
    let effectText = 'Không xác định';
    const value = buff.value;
    
    // Format value
    if (buff.type.includes('_add')) {
        effectText = `+${(value * 100).toFixed(1)}%`;
    } else if (buff.type.includes('_mul')) {
        effectText = `+${((value - 1) * 100).toFixed(0)}%`;
    }

    // Format type
    let typeText = "Hiệu ứng";
    if (buff.type.includes('breakthrough_chance')) typeText = "Tỷ lệ Đột Phá";
    else if (buff.type.includes('atk')) typeText = "Công Kích";
    else if (buff.type.includes('def')) typeText = "Phòng Ngự";
    else if (buff.type.includes('hp')) typeText = "Sinh Lực";
    else if (buff.type.includes('crit_rate')) typeText = "Tỷ lệ Bạo Kích";
    else if (buff.type.includes('qi_per_second_multiplier')) typeText = "Tốc Độ Tu Luyện";

    // Format duration
    let durationText = '';
    switch (buff.consumption_trigger) {
        case 'on_breakthrough':
            durationText = `(còn ${buff.duration_attempts || 1} lần Đột Phá)`;
            break;
        case 'on_pvp_fight':
            durationText = `(còn ${buff.duration_attempts || 1} trận Đấu Pháp)`;
            break;
        case 'on_guild_war_fight':
            durationText = `(còn ${buff.duration_attempts || 1} trận TMC)`;
            break;
        default:
            if (buff.expires_at) {
                const timeLeft = Math.max(0, Math.floor((buff.expires_at - Date.now()) / 1000));
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                durationText = `(còn ${minutes}m ${seconds}s)`;
            } else if (buff.duration_attempts) {
                durationText = `(còn ${buff.duration_attempts} lần)`;
            }
            break;
    }

    return `${typeText} ${effectText} ${durationText}`;
};


const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({ player, calculatedStats, gameData, onClose, onLogout, onEquipAvatar }) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showRootTooltip, setShowRootTooltip] = useState(false);
  const realmName = gameData.REALMS[player.realmIndex]?.name || 'Không rõ';
  const activeTechnique = gameData.TECHNIQUES.find(t => t.id === player.activeTechniqueId);
  const spiritualRoot = gameData.SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
  const activeBuffs = player.active_buffs?.filter(b => !b.expires_at || b.expires_at > Date.now()) || [];

  const handleSelectAvatar = (avatarId: string) => {
    onEquipAvatar(avatarId);
    setIsAvatarModalOpen(false); // Close avatar modal after selection
  };

  return (
    <>
      {isAvatarModalOpen && (
        <AvatarSelectionModal 
            player={player}
            gameData={gameData}
            onClose={() => setIsAvatarModalOpen(false)}
            onSelectAvatar={handleSelectAvatar}
        />
      )}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
        onClick={onClose}
      >
        <div 
          className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md m-4 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-600">
            <h2 className="text-2xl font-semibold text-cyan-300">Thông Tin Đạo Hữu</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
          </header>
          <main className="flex-grow p-6 overflow-y-auto scrollbar-modal">
              <div className="text-center bg-gradient-to-r from-slate-800 to-slate-900 p-3 rounded-lg border border-amber-500/50 mb-4">
                  <span className="text-sm text-slate-300">Tổng Lực Chiến</span>
                  {/* FIX: Convert combat_power to number before formatting to prevent runtime errors with BIGINT strings. */}
                  <span className="font-bold text-3xl text-amber-300 tracking-wider block" style={{textShadow: '0 0 8px #f59e0b88'}}>{formatNumber(Number(calculatedStats.combatPower))}</span>
              </div>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Tu Vi:</span><span className="font-bold text-emerald-400">{realmName}</span></div>
                  {spiritualRoot && (
                    <div className="flex justify-between items-baseline relative">
                        <span className="text-slate-400">Linh Căn:</span>
                        <button onClick={() => setShowRootTooltip(!showRootTooltip)} className="font-bold text-yellow-300 hover:text-yellow-200 underline decoration-dotted decoration-slate-500">
                            {spiritualRoot.name}
                        </button>
                        {showRootTooltip && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-600 rounded-lg shadow-lg p-3 z-10 text-left">
                                <p className="text-xs text-slate-300 italic mb-2">{spiritualRoot.description}</p>
                                {spiritualRoot.bonus.map((b, i) => (
                                    <p key={i} className="text-xs font-semibold text-amber-300">{formatBonus(b)}</p>
                                ))}
                            </div>
                        )}
                    </div>
                  )}
                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Pháp:</span><span className="font-bold text-cyan-300">{activeTechnique?.name || 'Không vận chuyển'}</span></div>
                  
                  <div className="border-t border-slate-700 my-2"></div>
                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Linh Thạch:</span><span className="font-bold text-yellow-400">{formatNumber(Number(player.linh_thach))}</span></div>
                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Bụi Luyện Khí:</span><span className="font-bold text-gray-400">{formatNumber(player.refinement_dust)}</span></div>
                  <div className="border-t border-slate-700 my-2"></div>

                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Đức:</span><span className="font-bold text-cyan-400">{formatNumber(player.merit)}</span></div>
                  <div className="flex justify-between items-baseline"><span className="text-slate-400">Ác Nghiệp:</span><span className="font-bold text-purple-400">{formatNumber(player.karma)}</span></div>
                  
                  <div className="border-t border-slate-600 my-3"></div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Sinh Lực:</span><span className="font-bold text-red-400">{formatNumber(calculatedStats.hp)}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Kích:</span><span className="font-bold text-orange-400">{formatNumber(calculatedStats.atk)}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Phòng Ngự:</span><span className="font-bold text-sky-400">{formatNumber(calculatedStats.def)}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Tốc Độ:</span><span className="font-bold text-teal-400">{formatNumber(calculatedStats.speed)}</span></div>
                  </div>

                  <div className="border-t border-slate-700 my-3"></div>
                  
                  <h3 className="text-md font-semibold text-cyan-400 pt-1">Chỉ số phụ</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Bạo Kích:</span><span className="font-bold text-rose-400">{`${(calculatedStats.critRate * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng Bạo:</span><span className="font-bold text-rose-200">{`${(calculatedStats.critResist * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">ST Bạo Kích:</span><span className="font-bold text-rose-400">{`${(calculatedStats.critDamage * 100).toFixed(0)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Né Tránh:</span><span className="font-bold text-lime-400">{`${(calculatedStats.dodgeRate * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Chính Xác:</span><span className="font-bold text-lime-200">{`${(calculatedStats.hitRate * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Hút Máu:</span><span className="font-bold text-pink-400">{`${(calculatedStats.lifestealRate * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng Hút Máu:</span><span className="font-bold text-pink-200">{`${(calculatedStats.lifestealResist * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Phản Đòn:</span><span className="font-bold text-indigo-400">{`${(calculatedStats.counterRate * 100).toFixed(1)}%`}</span></div>
                      <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng P.Đòn:</span><span className="font-bold text-indigo-200">{`${(calculatedStats.counterResist * 100).toFixed(1)}%`}</span></div>
                  </div>

                  {activeBuffs.length > 0 && (
                      <>
                          <div className="border-t border-slate-700 my-3"></div>
                          <h3 className="text-md font-semibold text-cyan-400 pt-1">Hiệu ứng tạm thời</h3>
                          <div className="space-y-1">
                              {activeBuffs.map((buff, index) => (
                                  <p key={index} className="text-amber-300 text-xs">{formatBuff(buff)}</p>
                              ))}
                          </div>
                      </>
                  )}

              </div>
          </main>
          <footer className="flex-shrink-0 p-4 border-t border-slate-600 space-y-2">
              <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-full px-4 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-slate-600 hover:bg-slate-500 text-white"
              >
                  Thay Đổi Pháp Tướng
              </button>
              <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-red-800 hover:bg-red-700 text-red-100 flex items-center justify-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Đăng Xuất
              </button>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PlayerStatsModal;
