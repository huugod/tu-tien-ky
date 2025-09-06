import React, { useState, useEffect, useCallback } from 'react';
import type { GameData } from '../types';
import { formatNumber } from '../constants';
import { API_BASE_URL } from '../config/config';

interface LeaderboardPlayer {
  name: string;
  realmIndex: number;
  combat_power: number;
  pvp_elo: number;
  is_banned: boolean;
}

interface LeaderboardPanelProps {
  token: string | null;
  onInspectPlayer: (name: string) => void;
  gameData: GameData;
}

const rankColors: { [key: number]: string } = {
  1: 'text-amber-300 font-bold',
  2: 'text-slate-300 font-bold',
  3: 'text-amber-600 font-bold',
};

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ token, onInspectPlayer, gameData }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'combat_power' | 'pvp'>('combat_power');

  const fetchLeaderboard = useCallback(async () => {
    if (!token) {
      setError("Yêu cầu xác thực để xem bảng xếp hạng.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const endpoint = activeTab === 'pvp' ? `${API_BASE_URL}/leaderboard/pvp` : `${API_BASE_URL}/leaderboard`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || 'Không thể tải bảng xếp hạng. Vui lòng thử lại.';
        throw new Error(message);
      }

      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  const getTabClass = (tabName: typeof activeTab) => `flex-1 py-2 text-sm font-semibold transition-colors duration-200 text-center ${activeTab === tabName ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`;


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-slate-400">Đang tải bảng xếp hạng...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-full text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      );
    }
    
    return (
       <div className="overflow-y-auto pr-2 flex-grow scrollbar-main">
          <ul className="space-y-2">
          {leaderboard.map((player, index) => {
              const rank = index + 1;
              const realmName = gameData.REALMS[player.realmIndex]?.name || 'Không rõ';
              return (
              <li key={player.name} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center">
                      <span className={`w-8 text-center text-lg ${rankColors[rank] || 'text-slate-400'}`}>
                          {rank}
                      </span>
                      <div className="ml-3">
                          <div className="flex items-center gap-2">
                              <button 
                                  onClick={() => onInspectPlayer(player.name)}
                                  className="font-semibold text-white text-left hover:text-cyan-300 transition-colors"
                              >
                                  {player.name}
                              </button>
                              {player.is_banned ? <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">BAN</span> : null}
                          </div>
                          <p className="text-xs text-emerald-400">{realmName}</p>
                      </div>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {activeTab === 'combat_power' 
                        ? `${formatNumber(Number(player.combat_power))} LC`
                        : `${player.pvp_elo} Elo`
                    }
                  </span>
              </li>
              );
          })}
          </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex border-b border-slate-700 flex-shrink-0">
          <button onClick={() => setActiveTab('combat_power')} className={getTabClass('combat_power')}>Lực Chiến</button>
          <button onClick={() => setActiveTab('pvp')} className={getTabClass('pvp')}>Đấu Pháp</button>
        </div>
        <div className="flex-grow min-h-0 pt-4">
            {renderContent()}
        </div>
    </div>
  );
};

export default LeaderboardPanel;