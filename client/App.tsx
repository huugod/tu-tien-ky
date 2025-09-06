import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player, GameEvent, GameData, ActiveEvent, GenericItem } from './types';
import { INITIAL_PLAYER, formatNumber, calculateTotalBonuses, calculateCombatStats, calculateBreakthroughBonusBreakdown, getClientId } from './constants';
import Header from './components/Header';
import Auth from './components/Auth';
import PlayerInspectModal from './components/PlayerInspectModal';
import PlayerStatsModal from './components/PlayerStatsModal';
import ConfirmationModal from './components/ConfirmationModal';
import Modal from './components/Modal';
import GameLog from './components/GameLog';
import ChatPanel from './components/ChatPanel';
import AvatarSelectionModal from './components/AvatarSelectionModal';
import LoadingScreen from './components/LoadingScreen';
import ItemDetailPopup from './components/ItemDetailPopup';
import ScrollingAnnouncement from './components/ScrollingAnnouncement';
import { API_BASE_URL } from './config/config';


// Import panel components for use in modals
import TechniquesPanel from './components/TechniquesPanel';
import BodyTemperingPanel from './components/BodyTemperingPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import GuildPanel from './components/GuildPanel';
import TrialGroundsPanel from './components/TrialGroundsPanel';
import AlchemyPanel from './components/AlchemyPanel';
import SystemPanel from './components/SystemPanel';
import EnlightenmentPanel from './components/EnlightenmentPanel';
import PvpPanel from './components/PvpPanel';
import MarketPanel from './components/MarketPanel';
import GuildWarPanel from './components/GuildWarPanel';
import InventoryPanel from './components/InventoryPanel';
import BlacksmithPanel from './components/BlacksmithPanel';
import MailPanel from './components/MailPanel'; // NEW: Import MailPanel
import { CauldronIcon, ScrollIcon, BodyIcon, SwordIcon, EnlightenmentIcon, GuildIcon, LeaderboardIcon, PvpIcon, ShopIcon, GuildWarIcon, SystemIcon, BagIcon, FurnaceIcon, MailIcon } from './components/Icons';


const SYNC_INTERVAL_MS = 5000; 

interface ExplorationStatus {
  locationId: string;
  endTime: number; 
}


// --- NEW COMPONENT FOR UNIFIED UI ---
const PlayerStatusBar = ({
    displayQi,
    qiPerSecond,
    currentRealm,
    nextRealm,
    qiProgress,
    onBreakthrough
}: {
    displayQi: number,
    qiPerSecond: number,
    currentRealm: any,
    nextRealm: any,
    qiProgress: number,
    onBreakthrough: () => void,
}) => {
    const canBreakthrough = currentRealm && displayQi >= currentRealm.qiThreshold && !!nextRealm;
    return (
        <div className="w-full max-w-5xl mx-auto p-3 bg-slate-900/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-4">
            <div className="flex-grow">
                <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-cyan-300">Linh Khí</span>
                    <span className="text-cyan-400/80">+{formatNumber(qiPerSecond)}/s</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600 relative mt-1">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300" style={{ width: `${qiProgress}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{textShadow: '1px 1px 2px #000'}}>
                        {formatNumber(displayQi)} / {currentRealm ? formatNumber(currentRealm.qiThreshold) : '...'}
                    </div>
                </div>
            </div>
            <button
                onClick={onBreakthrough}
                disabled={!canBreakthrough}
                className="flex-shrink-0 px-4 py-2 text-sm font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-gradient-to-r from-purple-600 to-indigo-600 text-white focus:outline-none focus:ring-4 focus:ring-purple-400/50 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
                {nextRealm ? `Đột Phá` : 'Tối Cao'}
            </button>
        </div>
    );
};

// Define a type for the panel objects to ensure type safety
interface PanelDefinition {
    id: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    component: React.ReactNode;
    count?: number; // count is optional
}

// --- Main App Component ---
const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [unreadMailCount, setUnreadMailCount] = useState(0); // NEW: Mail system state
const [activeTab, setActiveTab] = useState<"beast" | "fate" | "world">("world");
  // New Loading States
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Đang khởi tạo...');
  
  const [displayQi, setDisplayQi] = useState(0);
  const [isPlayerStatsModalOpen, setIsPlayerStatsModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [inspectPlayerName, setInspectPlayerName] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void } | null>(null);
  const [inspectingItem, setInspectingItem] = useState<{ item: GenericItem, owner?: string } | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);

  const [explorationStatus, setExplorationStatus] = useState<ExplorationStatus | null>(null);
  const [lastChallengeTime, setLastChallengeTime] = useState<{ [key: string]: number }>({});
  
  const eventIdCounter = useRef(0);
  const syncIntervalId = useRef<number | null>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null);


  const addEvent = useCallback((message: string, type: GameEvent['type']) => {
    setEvents(prev => [{ id: eventIdCounter.current++, message, type, timestamp: Date.now() }, ...prev].slice(0, 100));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setPlayer(INITIAL_PLAYER);
    if (syncIntervalId.current) clearInterval(syncIntervalId.current);
    addEvent('Đã đăng xuất.', 'info');
  }, [addEvent]);

  const processApiResponse = useCallback((data: any, options?: { isPeriodicSync?: boolean }) => {
    if (data.player) {
        if (options?.isPeriodicSync) {
            // For periodic sync, don't overwrite local Qi prediction.
            // Update everything else from the server.
            const { qi, ...restOfPlayer } = data.player;
            setPlayer(prevPlayer => ({
                ...prevPlayer, // Keep the client's current qi
                ...restOfPlayer, // Update with server state for all other fields
            }));
        } else {
            // For initial load or after an action, trust the server's state completely.
            setPlayer(data.player);
        }
    }
    // Check for undefined to handle the case where explorationStatus is explicitly set to null
    if (data.explorationStatus !== undefined) {
      setExplorationStatus(data.explorationStatus);
    }
    if (data.lastChallengeTime) {
      setLastChallengeTime(data.lastChallengeTime);
    }
    // NEW: Update unread mail count
    if (data.unreadMailCount !== undefined) {
        setUnreadMailCount(data.unreadMailCount);
    }
    // Handle logs from various API responses
    if (data.log) {
      addEvent(data.log.message, data.log.type);
    }
    // FIX: Handle combatLog for PvE activities to display results in the game log.
    if (data.combatLog && Array.isArray(data.combatLog)) {
        data.combatLog.forEach((logEntry: { message: string, type: GameEvent['type'] }) => {
            addEvent(logEntry.message, logEntry.type);
        });
    }
    if (data.offlineGains?.qi > 0) {
      addEvent(`Trong thời gian rời đi, bạn đã tu luyện được ${formatNumber(data.offlineGains.qi)} linh khí.`, 'info');
    }
    if (data.explorationLog) {
      addEvent(data.explorationLog.message, data.explorationLog.type);
    }
  }, [addEvent]);

  // Sync player state with server
  const syncPlayerState = useCallback(async (currentToken: string, isPeriodic: boolean = false) => {
    try {
        const response = await fetch(`${API_BASE_URL}/load`, {
            headers: { 
              'Authorization': `Bearer ${currentToken}`,
              'X-Client-ID': getClientId(),
            }
        });

        if (response.status === 401 || response.status === 403) {
            const data = await response.json();
            handleLogout();
            addEvent(`Phiên đăng nhập hết hạn. ${data.message || ''}`, 'danger');
            return;
        }

        if (!response.ok) {
          throw new Error('Mất kết nối với máy chủ.');
        }

        const data = await response.json();
        processApiResponse(data, { isPeriodicSync: isPeriodic });
    } catch (err) {
        console.error("Sync error:", err);
        addEvent((err as Error).message, 'danger');
        if (syncIntervalId.current) clearInterval(syncIntervalId.current);
    }
  }, [addEvent, handleLogout, processApiResponse]);
  
  const handleApiAction = useCallback(async (endpoint: string, body: object | null = null, method: 'POST' | 'GET' = 'POST') => {
    if (!token) return;
    try {
        const options: RequestInit = {
            method,
            headers: { 
              'Authorization': `Bearer ${token}`,
              'X-Client-ID': getClientId(),
            }
        };
        if (body) {
            options.headers = {...options.headers, 'Content-Type': 'application/json'};
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Hành động thất bại.');
        }

        processApiResponse(data);

        return true;
    } catch (err) {
        addEvent((err as Error).message, 'danger');
    }
  }, [token, addEvent, processApiResponse]);

  const handleLockItem = (instanceId: number, lock: boolean) => {
    return handleApiAction('/lock-item', { itemInstanceId: instanceId, lock });
  };


  // Login
  const handleLoginSuccess = useCallback(async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);

    setIsFullyLoaded(false);
    setLoadingMessage('Đang tải dữ liệu người chơi...');
    setLoadingProgress(0);

    await syncPlayerState(newToken);

    setLoadingProgress(100);
    setLoadingMessage('Hoàn tất!');
    
    setTimeout(() => {
        setIsFullyLoaded(true);
    }, 500);
  }, [syncPlayerState]);

  const showConfirmation = (title: string, message: React.ReactNode, onConfirm: () => void) => {
    setConfirmation({ title, message, onConfirm });
  };

  const handleChallengeResult = useCallback(() => {
    if (token) {
        syncPlayerState(token);
    }
  }, [token, syncPlayerState]);
  
    const handleShareItem = useCallback((item: GenericItem) => {
        // FIX: Add upgrade level to the displayed name in the chat message
        const isUpgradableEquipment = item.itemType === 'equipment' && item.upgrade_level > 0;
        const displayName = isUpgradableEquipment ? `${item.name} +${item.upgrade_level}` : item.name;
        const message = `[ITEM:${item.itemType}:${item.id}:${displayName}]`;

        handleApiAction('/chat/send', { message });
        addEvent(`Bạn đã chia sẻ [${displayName}] lên kênh Thế Giới.`, 'info');
    }, [handleApiAction, addEvent]);

    const handleInspectItem = useCallback((itemType: string, itemId: string, ownerName?: string) => {
        if (!gameData || !player) return;
        let itemData: GenericItem | null = null;
        
        if (itemType === 'equipment') {
            const playerItem = [...player.equipment, ...player.inventory].find(e => e.id === itemId);
            if (playerItem) {
                itemData = { ...playerItem, itemType: 'equipment' };
            } else {
                const staticItem = gameData.EQUIPMENT.find(e => e.id === itemId);
                if (staticItem) {
                    // FIX: Add missing 'upgrade_level' property to conform to the PlayerEquipment type.
                    itemData = { ...staticItem, itemType: 'equipment', instance_id: 0, is_equipped: false, upgrade_level: 0, is_locked: false };
                }
            }
        } else if (itemType === 'pill') {
            const found = gameData.PILLS.find(p => p.id === itemId);
            if (found) {
                const count = player.pills[itemId] || 1; 
                itemData = { ...found, itemType: 'pill', count };
            }
        } else if (itemType === 'herb') {
            const found = gameData.HERBS.find(h => h.id === itemId);
            if (found) {
                 const count = player.herbs[itemId] || 1;
                itemData = { ...found, itemType: 'herb', count };
            }
        }

        if (itemData) {
            setInspectingItem({ item: itemData, owner: ownerName });
        } else {
            addEvent("Không thể tìm thấy thông tin vật phẩm này.", "warning");
        }
    }, [gameData, player, addEvent]);
  
  // Initial application load effect
  useEffect(() => {
    const performInitialLoad = async () => {
        try {
            setLoadingMessage('Đang kết nối đến máy chủ...');
            setLoadingProgress(10);
            
            const res = await fetch(`${API_BASE_URL}/game-data`);
            if (!res.ok) throw new Error("Không thể kết nối máy chủ.");

            setLoadingMessage('Đang tải dữ liệu thế giới...');
            const progressInterval = setInterval(() => {
                setLoadingProgress(p => Math.min(90, p + 5));
            }, 100);

            const data = await res.json();
            clearInterval(progressInterval);
            
            setGameData(data);
            const styleSheet = document.createElement("style");
            styleSheet.innerText = data.CSS_ANIMATIONS.map((anim: any) => anim.keyframes_css).join('\n');
            document.head.appendChild(styleSheet);
            
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                setLoadingMessage('Đang đồng bộ dữ liệu người chơi...');
                setLoadingProgress(95);
                await syncPlayerState(storedToken);
            }

            setLoadingProgress(100);
            setLoadingMessage('Hoàn tất!');
            setTimeout(() => setIsFullyLoaded(true), 500);

        } catch (error) {
            console.error(error);
            setLoadingMessage(`Lỗi: ${(error as Error).message}`);
        }
    };
    performInitialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  
  // Periodic background sync effect
  useEffect(() => {
    if (isFullyLoaded && token) {
        syncIntervalId.current = window.setInterval(() => syncPlayerState(token, true), SYNC_INTERVAL_MS);
        return () => {
            if (syncIntervalId.current) clearInterval(syncIntervalId.current);
        };
    }
  }, [isFullyLoaded, token, syncPlayerState]);
  
   // Active events fetcher
  useEffect(() => {
    if (token) {
        const fetchEvents = async () => {
            const res = await fetch(`${API_BASE_URL}/events/active`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setActiveEvents(data);
            }
        };
        fetchEvents();
        const interval = setInterval(fetchEvents, 60000); // Check for new events every minute
        return () => clearInterval(interval);
    }
  }, [token]);

    // Announcement fetcher
  useEffect(() => {
    const fetchAnnouncement = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/announcements/active`);
            if (res.ok) {
                const data = await res.json();
                setActiveAnnouncement(data?.content || null);
            }
        } catch (err) {
            console.error("Failed to fetch announcement:", err);
        }
    };
    fetchAnnouncement();
    const interval = setInterval(fetchAnnouncement, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const { currentRealm, nextRealm, qiPerSecond, calculatedStats, avatarUrl } = useMemo(() => {
      if (!gameData || !player.name) return { qiPerSecond: 0, calculatedStats: {} };
      
      const currentRealm = gameData.REALMS[player.realmIndex];
      const nextRealm = gameData.REALMS[player.realmIndex + 1];
      
      // Client-side "virtual" calculation for immediate UI feedback
      const activeBonuses = calculateTotalBonuses(player, gameData, activeEvents);
      const stats = calculateCombatStats(player, gameData, activeBonuses);

      let qiPerSecond = 0;
      if (currentRealm && !explorationStatus) {
         qiPerSecond = (currentRealm.baseQiPerSecond * activeBonuses.qiMultiplier) + activeBonuses.qiPerSecondAdd;
      }
      
      const avatar = gameData.AVATARS.find(a => a.id === player.equipped_avatar_id);

      return { currentRealm, nextRealm, qiPerSecond, calculatedStats: stats, avatarUrl: avatar?.url };
  }, [player, gameData, explorationStatus, activeEvents]);

  // Qi Animation: Smooth client-side prediction
  useEffect(() => {
    let animationFrameId: number;
    
    // Establish a baseline for prediction whenever server data changes.
    const qiBaseline = {
        value: player.qi,
        timestamp: Date.now(),
    };

    const updateQiDisplay = () => {
        if (explorationStatus) {
            // If exploring, Qi doesn't increase. Stick to the server value.
            setDisplayQi(player.qi);
        } else {
            // Calculate time elapsed since the last baseline.
            const elapsedSeconds = (Date.now() - qiBaseline.timestamp) / 1000;
            
            // Predict the current Qi based on the generation rate.
            const predictedQi = qiBaseline.value + (elapsedSeconds * qiPerSecond);
            
            // Don't let the display exceed the breakthrough threshold.
            const qiCap = currentRealm?.qiThreshold ?? Infinity;
            
            setDisplayQi(Math.min(predictedQi, qiCap));
        }
        
        animationFrameId = requestAnimationFrame(updateQiDisplay);
    };

    // Start the animation loop.
    animationFrameId = requestAnimationFrame(updateQiDisplay);

    // Cleanup when dependencies change, stopping the old loop before a new one starts.
    return () => cancelAnimationFrame(animationFrameId);

  }, [player.qi, qiPerSecond, explorationStatus, currentRealm]);

  const handleBreakthroughClick = () => {
    if (!gameData || !currentRealm || !nextRealm) return;

    const breakdown = calculateBreakthroughBonusBreakdown(player, gameData, activeEvents);
    const baseChance = currentRealm.breakthroughChance;
    const totalBonus = breakdown.reduce((sum, b) => sum + b.value, 0);
    const totalChance = baseChance + totalBonus;

    // Karma/Merit Calculation for display
    const punishmentScalingConfig = gameData.PUNISHMENT_KARMA_SCALING;
    const meritKarmaOffsetRate = gameData.MERIT_KARMA_OFFSET_RATE?.value || 0;
    
    let karmaOffsetDisplay = 0;
    let effectiveKarma = player.karma;
    let meritUsedForOffset = 0;

    if (player.karma > 0 && player.merit > 0 && meritKarmaOffsetRate > 0) {
        const meritNeeded = Math.ceil(player.karma / meritKarmaOffsetRate);
        meritUsedForOffset = Math.min(player.merit, meritNeeded);
        karmaOffsetDisplay = Math.floor(meritUsedForOffset * meritKarmaOffsetRate);
        effectiveKarma = Math.max(0, player.karma - karmaOffsetDisplay);
    }

    const punishmentChance = punishmentScalingConfig ? (effectiveKarma * (punishmentScalingConfig.rate_per_point || 0)) : 0;

    const confirmationMessage = (
        <div className="text-left text-sm space-y-2">
            <p className="text-lg text-center">Bạn có chắc chắn muốn đột phá không?</p>
            <div className="border-t border-slate-600 my-2 pt-2">
                <div className="flex justify-between items-baseline text-xl">
                    <span className="font-semibold text-slate-300">Tổng Tỷ Lệ:</span>
                    <span className="font-bold text-cyan-300">{(totalChance * 100).toFixed(2)}%</span>
                </div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-md border border-slate-700">
                <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Tỷ lệ cơ bản:</span>
                    <span>{(baseChance * 100).toFixed(2)}%</span>
                </div>
                {breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between items-baseline">
                        <span className="text-slate-400">{b.source}:</span>
                        <span className="text-green-400">+{ (b.value * 100).toFixed(2) }%</span>
                    </div>
                ))}
            </div>
            
            {player.karma > 0 && (
                <div className="p-3 bg-slate-900/50 rounded-md border border-purple-800 mt-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-400">Ác Nghiệp Gốc:</span>
                        <span className="text-purple-400">{formatNumber(player.karma)}</span>
                    </div>
                     {meritUsedForOffset > 0 && (
                         <div className="flex justify-between items-baseline">
                            <span className="text-slate-400">Công Đức Tiêu Hao:</span>
                            <span className="text-red-400">-{formatNumber(meritUsedForOffset)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-400">Ác Nghiệp được Bù Trừ:</span>
                        <span className="text-cyan-400">-{formatNumber(karmaOffsetDisplay)}</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold">
                        <span className="text-slate-300">Ác Nghiệp Hiệu Quả:</span>
                        <span className="text-purple-300">{formatNumber(effectiveKarma)}</span>
                    </div>
                    <div className="border-t border-slate-700 my-1"></div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-400">Tỷ lệ Thiên Phạt:</span>
                        <span className="text-red-400 font-bold">{(punishmentChance * 100).toFixed(2)}%</span>
                    </div>
                </div>
            )}

            <p className="text-xs text-slate-500 text-center pt-2">Lưu ý: Tỷ lệ hiển thị là dự kiến. Kết quả cuối cùng được quyết định bởi máy chủ.</p>
        </div>
    );

    showConfirmation(
        'Xác Nhận Đột Phá',
        confirmationMessage,
        () => handleApiAction('/breakthrough')
    );
  };

  if (!isFullyLoaded) {
    return <LoadingScreen progress={loadingProgress} statusMessage={loadingMessage} />;
  }
  
  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  if (!gameData) { // This is a fallback
      return <div className="min-h-screen flex justify-center items-center"><p>Lỗi nghiêm trọng: Không có dữ liệu game.</p></div>;
  }
  
  const qiProgress = currentRealm ? Math.min(100, (displayQi / currentRealm.qiThreshold) * 100) : 0;

  const allPanels: PanelDefinition[] = [
      //log
      { id: 'log', label: 'Nhật Ký', icon: ScrollIcon, component: <GameLog events={events} /> },
      // Character Progression
      { id: 'inventory', label: 'Túi Đồ', icon: BagIcon, component: <InventoryPanel player={player} gameData={gameData} onEquipItem={(id) => handleApiAction('/equip-item', { itemInstanceId: id })} onUsePill={(id) => handleApiAction('/alchemy/use', { pillId: id })} onListItem={(id, price) => handleApiAction('/market/list', { itemInstanceId: id, price })} onListPill={(pillId, quantity, price) => handleApiAction('/market/list-pill', { pillId, quantity, price })} onLockItem={handleLockItem} onShareItem={handleShareItem}/> },
      { id: 'techniques', label: 'Công Pháp', icon: ScrollIcon, component: <TechniquesPanel player={player} onActivateTechnique={(id) => handleApiAction(`/activate-technique`, { techniqueId: id })} gameData={gameData} /> },
      { id: 'enlightenment', label: 'Lĩnh Ngộ', icon: EnlightenmentIcon, component: <EnlightenmentPanel player={player} onUnlockInsight={(id) => handleApiAction('/unlock-insight', { insightId: id })} gameData={gameData} /> },
      // Activities
      { id: 'body_tempering', label: 'Luyện Thể', icon: BodyIcon, component: <BodyTemperingPanel player={player} onTemperBody={() => handleApiAction('/temper-body')} onStartExploration={(loc) => handleApiAction('/start-exploration', { locationId: loc.id })} explorationStatus={explorationStatus} gameData={gameData} /> },
      { id: 'alchemy', label: 'Luyện Đan', icon: CauldronIcon, component: <AlchemyPanel player={player} onCraftPill={(id) => handleApiAction('/alchemy/craft', { recipeId: id })} gameData={gameData} /> },
      { id: 'blacksmith', label: 'Lò Rèn', icon: FurnaceIcon, component: <BlacksmithPanel player={player} gameData={gameData} onSmelt={(ids) => handleApiAction('/smelt-items', { itemInstanceIds: ids })} onUpgrade={(id) => handleApiAction('/blacksmith/upgrade', { itemInstanceId: id })} showConfirmation={showConfirmation} /> },
      { id: 'trial_grounds', label: 'Thí Luyện', icon: SwordIcon, component: <TrialGroundsPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={handleChallengeResult} addEvent={addEvent} gameData={gameData} /> },
      { id: 'pvp', label: 'Đấu Pháp', icon: PvpIcon, component: <PvpPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={handleChallengeResult} addEvent={addEvent} onBuyHonorItem={(id) => handleApiAction('/pvp/shop/buy', { itemId: id })} onLearnPvpSkill={(id) => handleApiAction('/pvp/learn-skill', { skillId: id })} onEquipPvpSkill={(id) => handleApiAction('/pvp/equip-skill', { skillId: id })} gameData={gameData} /> },
      // Social & Economy
      { id: 'guild', label: 'Tông Môn', icon: GuildIcon, component: <GuildPanel player={player} token={token} onAction={handleApiAction} onInspectPlayer={setInspectPlayerName} showConfirmation={showConfirmation} gameData={gameData} /> },
      { id: 'guild_war', label: 'TMC', icon: GuildWarIcon, component: <GuildWarPanel token={token} player={player} gameData={gameData} /> },
      { id: 'market', label: 'Chợ', icon: ShopIcon, component: <MarketPanel token={token} player={player} gameData={gameData} onAction={handleApiAction} showConfirmation={showConfirmation} /> },
      { id: 'leaderboard', label: 'Bảng Xếp Hạng', icon: LeaderboardIcon, component: <LeaderboardPanel token={token} onInspectPlayer={setInspectPlayerName} gameData={gameData} /> },
      // NEW: Mail system panel
      { id: 'mail', label: 'Thư', icon: MailIcon, component: <MailPanel token={token} onAction={handleApiAction} gameData={gameData} onRefreshPlayer={() => syncPlayerState(token!)} />, count: unreadMailCount },
      // System
      { id: 'system', label: 'Hệ Thống', icon: SystemIcon, component: <SystemPanel token={token} activeEvents={activeEvents} onRedeemCode={(code) => handleApiAction('/redeem-code', { code })}/> },
  ];
  const activePanel = allPanels.find(p => p.id === activeModal);

  // Main Render
  return (
    <>
      {activeAnnouncement && <ScrollingAnnouncement text={activeAnnouncement} />}
      <div className="min-h-screen game-bg text-slate-300 flex flex-col p-2 sm:p-4">
        <Header 
            player={player}
            gameData={gameData}
            avatarUrl={avatarUrl}
            onOpenStats={() => setIsPlayerStatsModalOpen(true)}
        />
        
        <main className="flex-grow grid grid-cols-1 gap-4 min-h-0 py-4 max-h-[calc(80vh-6rem)] w-full max-w-5xl mx-auto">
          <div className="panel flex flex-col max-h-[70vh]">
            {/* Tabs */}
            <div className="panel-header flex space-x-4 border-b border-slate-700">
              <button
                onClick={() => setActiveTab("beast")}
                className={`py-2 px-4 font-semibold ${
                  activeTab === "beast"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Thần Thú
              </button>
              <button
                onClick={() => setActiveTab("fate")}
                className={`py-2 px-4 font-semibold ${
                  activeTab === "fate"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tiên Duyên
              </button>
              <button
                onClick={() => setActiveTab("world")}
                className={`py-2 px-4 font-semibold ${
                  activeTab === "world"
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Thế Giới
              </button>
            </div>

            {/* Nội dung từng tab */}
            <div className="panel-content flex-grow ">
              {activeTab === "beast" && (
                <div className="flex items-center justify-center p-4 text-slate-500 italic">
                  Tính năng sắp ra mắt...
                </div>
              )}

              {activeTab === "fate" && (
                <div className="flex items-center justify-center p-4 text-slate-500 italic">
                  Tính năng sắp ra mắt...
                </div>
              )}

              {activeTab === "world" && token && gameData && (
  <div className="h-[40vh]">
    <ChatPanel
      token={token}
      gameData={gameData}
      onInspectItem={handleInspectItem}
      onInspectPlayer={setInspectPlayerName}
    />
  </div>
)}
            </div>
          </div>
        </main>

        <footer className="flex-shrink-0 space-y-3">
            <div className="w-full max-w-5xl mx-auto p-2 bg-slate-900/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm">
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-15 gap-2">
                    {allPanels.map(panel => (
                      <div key={panel.id} className="relative">
                          <button onClick={() => setActiveModal(panel.id)} className="flex flex-col items-center justify-center aspect-square bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/70 hover:border-cyan-400 transition-all text-slate-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full h-full">
                              <panel.icon className="h-6 w-6" />
                              <span className="text-xs mt-1.5 text-center leading-tight">{panel.label}</span>
                          </button>
                           {(panel.count ?? 0) > 0 && (
                              <div className="absolute top-0 right-0 -mt-1 -mr-1 flex justify-center items-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full pointer-events-none">
                                {panel.count}
                              </div>
                            )}
                      </div>
                   ))}
                </div>
            </div>
            <PlayerStatusBar
                displayQi={displayQi}
                qiPerSecond={qiPerSecond}
                currentRealm={currentRealm}
                nextRealm={nextRealm}
                qiProgress={qiProgress}
                onBreakthrough={handleBreakthroughClick}
            />
        </footer>
      </div>
      
      {/* --- Modals --- */}
      {isPlayerStatsModalOpen && <PlayerStatsModal player={player} calculatedStats={calculatedStats} gameData={gameData} onClose={() => setIsPlayerStatsModalOpen(false)} onLogout={handleLogout} onEquipAvatar={(id) => handleApiAction('/equip-avatar', {avatarId: id})} />}
      {isAvatarModalOpen && <AvatarSelectionModal player={player} gameData={gameData} onClose={() => setIsAvatarModalOpen(false)} onSelectAvatar={(id) => handleApiAction('/equip-avatar', { avatarId: id })} />}
      {inspectPlayerName && <PlayerInspectModal playerName={inspectPlayerName} token={token!} onClose={() => setInspectPlayerName(null)} gameData={gameData} />}
      {confirmation && <ConfirmationModal isOpen={!!confirmation} title={confirmation.title} message={confirmation.message} onConfirm={() => { confirmation.onConfirm(); setConfirmation(null); }} onCancel={() => setConfirmation(null)} />}
      {activeModal && activePanel && <Modal title={activePanel.label} onClose={() => setActiveModal(null)}>{activePanel.component}</Modal>}
      {inspectingItem && gameData && (
                <ItemDetailPopup 
                    item={inspectingItem.item}
                    owner={inspectingItem.owner}
                    player={player}
                    gameData={gameData}
                    onClose={() => setInspectingItem(null)}
                    isInspectionOnly={true}
                />
      )}
    </>
  );
};

export default App;