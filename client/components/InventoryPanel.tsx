import React, { useState, useMemo } from 'react';
import type { Player, GameData, GenericItem, Pill, Herb } from '../types';
import ItemDetailPopup from './ItemDetailPopup';
import { getRarityStyle } from '../constants';
import { LockIcon } from './Icons';

interface InventoryPanelProps {
    player: Player;
    gameData: GameData;
    onEquipItem: (itemInstanceId: number) => void;
    onUsePill: (pillId: string) => void;
    onListItem: (itemInstanceId: number, price: number) => void;
    onListPill: (pillId: string, quantity: number, price: number) => void;
    onLockItem: (instanceId: number, lock: boolean) => void;
    onShareItem: (item: GenericItem) => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = (props) => {
    const { player, gameData, onLockItem } = props;
    const [activeTab, setActiveTab] = useState<'all' | 'equipment' | 'pills' | 'herbs'>('all');
    const [selectedItem, setSelectedItem] = useState<GenericItem | null>(null);

    const allItems = useMemo((): GenericItem[] => {
        const equipment: GenericItem[] = [...player.equipment, ...player.inventory].map(e => ({ ...e, itemType: 'equipment' }));
        const pills: GenericItem[] = Object.entries(player.pills).map(([id, count]) => {
            const pillData = gameData.PILLS.find(p => p.id === id);
            return pillData ? { ...pillData, itemType: 'pill', count } : null;
        }).filter((p): p is Pill & { itemType: 'pill', count: number } => p !== null && p.count > 0);
        const herbs: GenericItem[] = Object.entries(player.herbs).map(([id, count]) => {
            const herbData = gameData.HERBS.find(h => h.id === id);
            return herbData ? { ...herbData, itemType: 'herb', count } : null;
        }).filter((h): h is Herb & { itemType: 'herb', count: number } => h !== null && h.count > 0);
        
        return [...equipment, ...pills, ...herbs];
    }, [player, gameData]);

    const filteredItems = useMemo(() => {
        if (activeTab === 'all') return allItems;
        if (activeTab === 'equipment') {
            return allItems.filter(item => item.itemType === 'equipment');
        }
        if (activeTab === 'pills') {
            return allItems.filter(item => item.itemType === 'pill');
        }
        if (activeTab === 'herbs') {
            // FIX: Corrected item type from 'herbs' to 'herb' to match the type definition.
            return allItems.filter(item => item.itemType === 'herb');
        }
        return [];
    }, [allItems, activeTab]);

    const getTabClass = (tabName: typeof activeTab) => {
        return `flex-1 py-2 text-sm font-semibold transition-colors duration-200 text-center ${
            activeTab === tabName 
            ? 'text-cyan-300 border-b-2 border-cyan-400 bg-slate-800/50' 
            : 'text-slate-400 hover:text-white'
        }`;
    };

    const handleItemClick = (item: GenericItem) => {
        setSelectedItem(item);
    };

    return (
        <div className="flex flex-col h-full">
            {selectedItem && <ItemDetailPopup item={selectedItem} {...props} onLockItem={onLockItem} onClose={() => setSelectedItem(null)} />}
            
            <div className="flex border-b border-slate-700 flex-shrink-0">
                <button onClick={() => setActiveTab('all')} className={getTabClass('all')}>Tất Cả</button>
                <button onClick={() => setActiveTab('equipment')} className={getTabClass('equipment')}>Trang Bị</button>
                <button onClick={() => setActiveTab('pills')} className={getTabClass('pills')}>Đan Dược</button>
                <button onClick={() => setActiveTab('herbs')} className={getTabClass('herbs')}>Linh Thảo</button>
            </div>

            <div className="flex-grow min-h-0 pt-4 overflow-y-auto scrollbar-main pr-2">
                {filteredItems.length === 0 ? (
                     <p className="text-center text-slate-500 pt-16">Túi đồ trống.</p>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {filteredItems.map(item => {
                            const key = item.itemType === 'equipment' ? `eq-${item.instance_id}` : `${item.itemType}-${item.id}`;
                            const rarityId = (item.itemType === 'equipment' || item.itemType === 'pill') ? item.rarity : undefined;
                            const { style, className: rarityClassName } = getRarityStyle(rarityId, gameData.RARITIES, 'container');
                            const borderColor = style.backgroundImage ? 'transparent' : (typeof style.color === 'string' ? style.color : '#475569');
                            
                            const isEquipped = item.itemType === 'equipment' && item.is_equipped;
                            const isLocked = item.itemType === 'equipment' && item.is_locked;
                            const upgradeLevel = item.itemType === 'equipment' ? item.upgrade_level : 0;
                            
                            return (
                                <div 
                                    key={key} 
                                    onClick={() => handleItemClick(item)} 
                                    className={`relative aspect-square bg-slate-800/50 border-2 rounded-lg cursor-pointer hover:border-cyan-400 transition-colors ${rarityClassName || ''}`}
                                    style={{
                                        borderColor,
                                        backgroundImage: style.backgroundImage,
                                    }}
                                >
                                    {/* FIX: Wrapper for centering the icon image to prevent layout shifts */}
                                    <div className="absolute inset-0 flex items-center justify-center p-1">
                                        {item.icon_url ? (
                                            <img src={item.icon_url} alt={item.name} className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <span className="text-xs text-center text-slate-400 p-1">{item.name}</span>
                                        )}
                                    </div>
                                    
                                    {/* Overlays */}
                                    {(item.itemType === 'pill' || item.itemType === 'herb') && item.count > 1 && (
                                        <span className="absolute bottom-0 right-0 text-xs font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded-tl-lg rounded-br-md">
                                            {item.count}
                                        </span>
                                    )}
                                    
                                    {/* FIX: Combined logic for top-left icon to prevent incorrect rendering. */}
                                    {isEquipped ? (
                                        <span className="absolute top-0 left-0 text-xs font-bold text-black bg-cyan-300 px-1.5 py-0.5 rounded-tl-md rounded-br-md">
                                            E
                                        </span>
                                    ) : isLocked ? (
                                        <span className="absolute top-0 left-0 p-0.5 bg-slate-900/80 rounded-br-lg rounded-tl-md">
                                            <LockIcon className="h-3 w-3 text-amber-300" />
                                        </span>
                                    ) : null}

                                    {upgradeLevel > 0 && (
                                        <span className="absolute top-0 right-0 text-xs font-bold text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded-bl-lg rounded-tr-md">
                                            +{upgradeLevel}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryPanel;
