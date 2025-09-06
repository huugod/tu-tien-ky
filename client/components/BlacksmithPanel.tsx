import React, { useState, useMemo } from 'react';
import type { Player, GameData, PlayerEquipment, EquipmentBonus } from '../types';
import { formatNumber, getRarityStyle, formatBonus } from '../constants';

// Props
interface BlacksmithPanelProps {
    player: Player;
    gameData: GameData;
    onSmelt: (itemInstanceIds: number[]) => void;
    onUpgrade: (itemInstanceId: number) => void;
    showConfirmation: (title: string, message: React.ReactNode, onConfirm: () => void) => void;
}

// Smelting Component (Manual Tab Content)
const SmeltingTab: React.FC<Pick<BlacksmithPanelProps, 'player' | 'gameData' | 'onSmelt' | 'showConfirmation'>> = ({ player, gameData, onSmelt, showConfirmation }) => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const availableItems = useMemo(() => {
        return player.inventory
            .filter(item => item.smelt_yield > 0 && !item.is_locked)
            .sort((a, b) => {
                const rarityA = gameData.RARITIES.findIndex(r => r.id === a.rarity);
                const rarityB = gameData.RARITIES.findIndex(r => r.id === b.rarity);
                return rarityA - rarityB;
            });
    }, [player.inventory, gameData.RARITIES]);

    const selectedItems = useMemo(() => {
        return availableItems.filter(item => selectedIds.has(item.instance_id));
    }, [availableItems, selectedIds]);
    
    const totalDustYield = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + (item.smelt_yield || 0), 0);
    }, [selectedItems]);

    const toggleSelection = (instanceId: number) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(instanceId)) {
            newSelection.delete(instanceId);
        } else {
            newSelection.add(instanceId);
        }
        setSelectedIds(newSelection);
    };

    const handleSmelt = () => {
        if (selectedItems.length === 0) return;
        showConfirmation(
            'Xác Nhận Luyện Hóa',
            `Bạn có chắc muốn luyện hóa ${selectedItems.length} pháp bảo để nhận ${formatNumber(totalDustYield)} Bụi Luyện Khí không? Hành động này không thể hoàn tác!`,
            () => {
                onSmelt(Array.from(selectedIds));
                setSelectedIds(new Set());
            }
        );
    };
    
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                {/* Item Selection */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col">
                     <h4 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Túi Đồ (Chưa khóa)</h4>
                     <div className="flex-grow overflow-y-auto scrollbar-main pr-2 grid grid-cols-4 sm:grid-cols-5 gap-2">
                         {availableItems.length === 0 && <div className="col-span-full text-center text-slate-500 pt-10">Không có vật phẩm nào có thể luyện hóa.</div>}
                        {availableItems.map(item => {
                            const { style, className: rarityClassName } = getRarityStyle(item.rarity, gameData.RARITIES, 'container');
                            const isSelected = selectedIds.has(item.instance_id);
                            return (
                                <div 
                                    key={item.instance_id} 
                                    onClick={() => toggleSelection(item.instance_id)} 
                                    className={`relative aspect-square bg-slate-800 border-2 rounded-lg cursor-pointer transition-all flex items-center justify-center p-1 ${isSelected ? 'border-cyan-400' : 'hover:border-slate-500'} ${rarityClassName || ''}`} 
                                    style={{ 
                                        borderColor: isSelected ? undefined : (style.backgroundImage ? 'transparent' : style.color),
                                        backgroundImage: style.backgroundImage
                                    }}
                                >
                                    {item.icon_url ? <img src={item.icon_url} alt={item.name} className="max-w-full max-h-full" /> : <span className="text-xs text-center text-slate-400 p-1">{item.name}</span>}
                                    <span className="absolute bottom-0 right-0 text-xs font-bold text-amber-300 bg-slate-900/80 px-1 py-0.5 rounded-tl-lg rounded-br-md">+{item.smelt_yield}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Smelting Area */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col">
                    <h4 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Lò Luyện</h4>
                     <div className="flex-grow overflow-y-auto scrollbar-main pr-2 grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {selectedItems.length === 0 && <div className="col-span-full text-center text-slate-500 pt-10">Chọn vật phẩm để luyện hóa.</div>}
                        {selectedItems.map(item => {
                            const { style, className: rarityClassName } = getRarityStyle(item.rarity, gameData.RARITIES, 'container');
                            return (
                                 <div 
                                    key={item.instance_id} 
                                    onClick={() => toggleSelection(item.instance_id)} 
                                    className={`relative aspect-square bg-slate-800 border-2 border-cyan-400 rounded-lg cursor-pointer flex items-center justify-center p-1 ${rarityClassName || ''}`}
                                    style={{ backgroundImage: style.backgroundImage }}
                                >
                                    {item.icon_url ? <img src={item.icon_url} alt={item.name} className="max-w-full max-h-full" /> : <span className="text-xs text-center text-slate-400 p-1">{item.name}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Action footer */}
            <div className="flex-shrink-0 border-t border-slate-700 pt-3 text-center space-y-3">
                 <div className="flex justify-around items-baseline">
                    <div>
                        <p className="text-slate-400 text-sm">Bụi Hiện Có</p>
                        <p className="text-xl font-bold text-white">{formatNumber(player.refinement_dust)}</p>
                    </div>
                    <div className="text-2xl text-slate-500">+</div>
                    <div>
                        <p className="text-slate-400 text-sm">Sẽ Nhận</p>
                        <p className="text-xl font-bold text-amber-300">{formatNumber(totalDustYield)}</p>
                    </div>
                </div>
                <button
                    onClick={handleSmelt}
                    disabled={selectedItems.length === 0}
                    className="w-full px-4 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-orange-600 to-red-500 text-white focus:outline-none focus:ring-4 focus:ring-red-400/50 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                >
                    Luyện Hóa ({selectedItems.length})
                </button>
            </div>
        </div>
    );
};

// Upgrading Component (Tab Content)
const UpgradingTab: React.FC<Pick<BlacksmithPanelProps, 'player' | 'gameData' | 'onUpgrade'>> = ({ player, gameData, onUpgrade }) => {
    const [selectedItem, setSelectedItem] = useState<PlayerEquipment | null>(null);

    const upgradableItems = useMemo(() => {
        return [...player.equipment, ...player.inventory].filter(item => item.is_upgradable);
    }, [player.equipment, player.inventory]);

    const upgradeDetails = useMemo(() => {
        if (!selectedItem) return null;
        const nextLevel = (selectedItem.upgrade_level || 0) + 1;
        const config = gameData.EQUIPMENT_UPGRADES.find(u => u.upgrade_level === nextLevel);
        if (!config) return { isMaxLevel: true };

        const baseItem = gameData.EQUIPMENT.find(e => e.id === selectedItem.id);
        if (!baseItem) return null;

        const currentUpgradeConfig = gameData.EQUIPMENT_UPGRADES.find(u => u.upgrade_level === selectedItem.upgrade_level);
        const currentMultiplier = currentUpgradeConfig?.stat_multiplier || 1;

        const applyMultiplier = (bonuses: EquipmentBonus[], multiplier: number): EquipmentBonus[] => {
            if (multiplier === 1) return bonuses;
            return bonuses.map(bonus => {
                const newBonus = { ...bonus };
                if (bonus.type.endsWith('_add')) {
                    newBonus.value = bonus.value * multiplier;
                } else if (bonus.type.endsWith('_mul')) {
                    newBonus.value = (bonus.value - 1) * multiplier + 1;
                }
                return newBonus;
            });
        };
        
        return {
            isMaxLevel: false,
            config,
            currentBonuses: applyMultiplier(baseItem.bonuses, currentMultiplier),
            nextBonuses: applyMultiplier(baseItem.bonuses, config.stat_multiplier),
        };
    }, [selectedItem, gameData]);

    const handleUpgrade = () => {
        if (selectedItem) {
            onUpgrade(selectedItem.instance_id);
        }
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Item List */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col">
                <h4 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Chọn Trang Bị</h4>
                <div className="flex-grow overflow-y-auto scrollbar-main pr-2 grid grid-cols-4 gap-2">
                    {upgradableItems.length === 0 && <div className="col-span-full text-center text-slate-500 pt-10">Không có trang bị nào có thể cường hóa.</div>}
                    {upgradableItems.map(item => {
                        const { style, className: rarityClassName } = getRarityStyle(item.rarity, gameData.RARITIES, 'container');
                        const isSelected = selectedItem?.instance_id === item.instance_id;
                        return (
                            <div 
                                key={item.instance_id} 
                                onClick={() => setSelectedItem(item)} 
                                className={`relative aspect-square bg-slate-800 border-2 rounded-lg cursor-pointer transition-all flex items-center justify-center p-1 ${isSelected ? 'border-cyan-400' : 'hover:border-slate-500'} ${rarityClassName || ''}`}
                                style={{ 
                                    borderColor: isSelected ? undefined : (style.backgroundImage ? 'transparent' : style.color),
                                    backgroundImage: style.backgroundImage
                                }}
                            >
                                {item.icon_url ? <img src={item.icon_url} alt={item.name} className="max-w-full max-h-full" /> : <span className="text-xs text-center text-slate-400 p-1">{item.name}</span>}
                                {item.upgrade_level > 0 && <span className="absolute top-0 right-0 text-xs font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded-bl-lg rounded-tr-md">+{item.upgrade_level}</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Upgrade Details */}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col">
                <h4 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Thông Tin Cường Hóa</h4>
                <div className="flex-grow overflow-y-auto scrollbar-main pr-2">
                    {!selectedItem && <div className="text-center text-slate-500 pt-10">Hãy chọn một trang bị để cường hóa.</div>}
                    {selectedItem && upgradeDetails && (
                        <div className="space-y-3 text-sm">
                            <h5 className="font-bold text-lg text-white">
                                {selectedItem.name}
                                {selectedItem.upgrade_level > 0 && <span className="text-amber-300 ml-1">+{selectedItem.upgrade_level}</span>}
                            </h5>
                            {('config' in upgradeDetails && upgradeDetails.config) ? (
                                <>
                                    <div>
                                        <p className="text-slate-400">Thuộc tính hiện tại:</p>
                                        {upgradeDetails.currentBonuses.map((b, i) => <p key={i} className="text-cyan-300 pl-2">{formatBonus(b)}</p>)}
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Sau khi cường hóa (+{upgradeDetails.config.upgrade_level}):</p>
                                        {upgradeDetails.nextBonuses.map((b, i) => <p key={i} className="text-green-400 pl-2">{formatBonus(b)}</p>)}
                                    </div>
                                    <div className="border-t border-slate-700 pt-3 space-y-1">
                                        <p>Tỷ lệ thành công: <span className="font-bold text-yellow-400">{(upgradeDetails.config.success_chance * 100).toFixed(0)}%</span></p>
                                        <p>Yêu cầu: <span className={`font-bold ${player.refinement_dust >= upgradeDetails.config.required_dust ? 'text-amber-300' : 'text-red-500'}`}>{formatNumber(upgradeDetails.config.required_dust)} Bụi Luyện Khí</span></p>
                                        <p className="text-xs text-slate-500">Thất bại chỉ mất Bụi Luyện Khí.</p>
                                    </div>
                                    <div className="flex-shrink-0 pt-3 mt-auto">
                                        <button 
                                            onClick={handleUpgrade} 
                                            disabled={player.refinement_dust < upgradeDetails.config.required_dust}
                                            className="w-full px-4 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-purple-600 to-indigo-500 text-white focus:outline-none focus:ring-4 focus:ring-purple-400/50 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                                        >
                                            Cường Hóa
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-amber-400 font-bold">Đã đạt cấp tối đa.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const QuickSmeltTab: React.FC<Pick<BlacksmithPanelProps, 'player' | 'gameData' | 'onSmelt' | 'showConfirmation'>> = ({ player, gameData, onSmelt, showConfirmation }) => {
    const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());

    const itemsToSmelt = useMemo(() => {
        if (selectedRarities.size === 0) return [];
        return player.inventory.filter(item =>
            !item.is_equipped &&
            !item.is_locked &&
            item.smelt_yield > 0 &&
            selectedRarities.has(item.rarity || 'common')
        );
    }, [player.inventory, selectedRarities]);

    const totalDustYield = useMemo(() => {
        return itemsToSmelt.reduce((sum, item) => sum + item.smelt_yield, 0);
    }, [itemsToSmelt]);

    const handleRarityToggle = (rarityId: string) => {
        const newSelection = new Set(selectedRarities);
        if (newSelection.has(rarityId)) {
            newSelection.delete(rarityId);
        } else {
            newSelection.add(rarityId);
        }
        setSelectedRarities(newSelection);
    };
    
    const handleSmelt = () => {
        if (itemsToSmelt.length === 0) return;
        const itemIds = itemsToSmelt.map(item => item.instance_id);
        showConfirmation(
            'Xác nhận Rã Nhanh',
            (<>
                <p>Bạn có chắc muốn luyện hóa <span className="font-bold text-amber-300">{itemsToSmelt.length}</span> pháp bảo theo độ hiếm đã chọn để nhận <span className="font-bold text-amber-300">{formatNumber(totalDustYield)}</span> Bụi Luyện Khí không?</p>
                <p className="text-sm text-slate-400 mt-2">Lưu ý: Các vật phẩm đã khóa sẽ được bỏ qua. Hành động này không thể hoàn tác.</p>
            </>),
            () => {
                onSmelt(itemIds);
                setSelectedRarities(new Set());
            }
        );
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <h4 className="text-md font-semibold text-emerald-400 mb-2">Chọn Độ Hiếm Cần Rã</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gameData.RARITIES.map(rarity => (
                        <label key={rarity.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-700/50">
                            <input
                                type="checkbox"
                                checked={selectedRarities.has(rarity.id)}
                                onChange={() => handleRarityToggle(rarity.id)}
                                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-600"
                            />
                            <span style={getRarityStyle(rarity.id, gameData.RARITIES).style} className={getRarityStyle(rarity.id, gameData.RARITIES).className}>{rarity.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 border-t border-slate-700 pt-3 text-center space-y-3">
                 <div className="flex justify-around items-baseline">
                    <div>
                        <p className="text-slate-400 text-sm">Số lượng chọn</p>
                        <p className="text-xl font-bold text-white">{itemsToSmelt.length}</p>
                    </div>
                     <div>
                        <p className="text-slate-400 text-sm">Bụi sẽ nhận</p>
                        <p className="text-xl font-bold text-amber-300">{formatNumber(totalDustYield)}</p>
                    </div>
                </div>
                <button
                    onClick={handleSmelt}
                    disabled={itemsToSmelt.length === 0}
                    className="w-full px-4 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-orange-600 to-red-500 text-white focus:outline-none focus:ring-4 focus:ring-red-400/50 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
                >
                   Rã Nhanh!
                </button>
            </div>
        </div>
    );
};

// Main Panel Component
const BlacksmithPanel: React.FC<BlacksmithPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'upgrade' | 'smelt' | 'quick_smelt'>('upgrade');
    
    const getTabClass = (tabName: typeof activeTab) => `flex-1 py-2 text-sm font-semibold transition-colors duration-200 text-center ${activeTab === tabName ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`;
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-slate-700 flex-shrink-0">
                <button onClick={() => setActiveTab('upgrade')} className={getTabClass('upgrade')}>Cường Hóa</button>
                <button onClick={() => setActiveTab('smelt')} className={getTabClass('smelt')}>Luyện Hóa</button>
                <button onClick={() => setActiveTab('quick_smelt')} className={getTabClass('quick_smelt')}>Rả Nhanh</button>
            </div>
            <div className="flex-grow min-h-0 pt-4">
                {activeTab === 'upgrade' && <UpgradingTab {...props} />}
                {activeTab === 'smelt' && <SmeltingTab {...props} />}
                {activeTab === 'quick_smelt' && <QuickSmeltTab {...props} />}
            </div>
        </div>
    );
};

export default BlacksmithPanel;