import React, { useState, useEffect } from 'react';
import type { InspectPlayer, GameData } from '../types';
import { formatNumber } from '../constants';
import { API_BASE_URL } from '../config/config';

interface PlayerInspectModalProps {
  playerName: string;
  token: string;
  onClose: () => void;
  gameData: GameData;
}

const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({ playerName, token, onClose, gameData }) => {
  const [playerData, setPlayerData] = useState<InspectPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/player/${encodeURIComponent(playerName)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Không thể lấy thông tin đạo hữu này.');
        }
        const data: InspectPlayer = await response.json();
        setPlayerData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerName, token]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-slate-400 text-center">Đang quan sát...</p>;
    }
    if (error) {
      return <p className="text-red-400 text-center">{error}</p>;
    }
    if (playerData) {
      const realmName = gameData.REALMS[playerData.realmIndex]?.name || 'Không rõ';
      const activeTechnique = gameData.TECHNIQUES.find(t => t.id === playerData.activeTechniqueId);
      const spiritualRoot = gameData.SPIRITUAL_ROOTS.find(r => r.id === playerData.spiritualRoot);

      return (
        <>
          {playerData.is_banned ? (
                <div className="bg-red-900/50 border border-red-700 p-3 rounded-lg mb-4 text-center">
                    <h3 className="text-lg font-bold text-red-300">TÀI KHOẢN BỊ KHÓA</h3>
                    <p className="text-sm text-red-200">Lý do: {playerData.ban_reason || 'Không có lý do cụ thể.'}</p>
                </div>
            ) : null}
          <div className="text-center bg-gradient-to-r from-slate-800 to-slate-900 p-3 rounded-lg border border-amber-500/50 mb-4">
              <span className="text-sm text-slate-300">Tổng Lực Chiến</span>
              {/* FIX: Convert combat_power to number before formatting to prevent runtime errors with BIGINT strings. */}
              <span className="font-bold text-3xl text-amber-300 tracking-wider block" style={{textShadow: '0 0 8px #f59e0b88'}}>{formatNumber(Number(playerData.combat_power))}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-baseline"><span className="text-slate-400">Tu Vi:</span><span className="font-bold text-emerald-400">{realmName}</span></div>
            {spiritualRoot && (<div className="flex justify-between items-baseline"><span className="text-slate-400">Linh Căn:</span><span className="font-bold text-yellow-300">{spiritualRoot.name}</span></div>)}
            <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Pháp:</span><span className="font-bold text-cyan-300">{activeTechnique?.name || 'Không vận chuyển'}</span></div>
            <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Đức:</span><span className="font-bold text-cyan-400">{formatNumber(playerData.merit)}</span></div>
            <div className="flex justify-between items-baseline"><span className="text-slate-400">Ác Nghiệp:</span><span className="font-bold text-purple-400">{formatNumber(playerData.karma)}</span></div>
            
            <div className="border-t border-slate-600 my-3"></div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Sinh Lực:</span><span className="font-bold text-red-400">{formatNumber(playerData.calculatedHp)}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Công Kích:</span><span className="font-bold text-orange-400">{formatNumber(playerData.calculatedAtk)}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Phòng Ngự:</span><span className="font-bold text-sky-400">{formatNumber(playerData.calculatedDef)}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Tốc Độ:</span><span className="font-bold text-teal-400">{formatNumber(playerData.calculatedSpeed)}</span></div>
            </div>

            <div className="border-t border-slate-700 my-3"></div>
            
            <h3 className="text-md font-semibold text-cyan-400 pt-1">Chỉ số phụ</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Bạo Kích:</span><span className="font-bold text-rose-400">{`${(playerData.calculatedCritRate * 100).toFixed(1)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng Bạo:</span><span className="font-bold text-rose-200">{`${(playerData.calculatedCritResist * 100).toFixed(1)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">ST Bạo Kích:</span><span className="font-bold text-rose-400">{`${(playerData.calculatedCritDamage * 100).toFixed(0)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Né Tránh:</span><span className="font-bold text-lime-400">{`${(playerData.calculatedDodgeRate * 100).toFixed(1)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Chính Xác:</span><span className="font-bold text-lime-200">{`${(playerData.calculatedHitRate * 100).toFixed(1)}%`}</span></div>
               <div className="flex justify-between items-baseline"><span className="text-slate-400">Hút Máu:</span><span className="font-bold text-pink-400">{`${(playerData.calculatedLifesteal * 100).toFixed(1)}%`}</span></div>
               <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng Hút Máu:</span><span className="font-bold text-pink-200">{`${(playerData.calculatedLifestealResist * 100).toFixed(1)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Phản Đòn:</span><span className="font-bold text-indigo-400">{`${(playerData.calculatedCounter * 100).toFixed(1)}%`}</span></div>
              <div className="flex justify-between items-baseline"><span className="text-slate-400">Kháng P.Đòn:</span><span className="font-bold text-indigo-200">{`${(playerData.calculatedCounterResist * 100).toFixed(1)}%`}</span></div>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md m-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-600">
          <h2 className="text-2xl font-semibold text-cyan-300">Quan Sát: {playerName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto scrollbar-modal">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PlayerInspectModal;