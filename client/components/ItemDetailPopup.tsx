import React, { useState } from 'react';
import type { Player, GameData, GenericItem, Pill } from '../types';
import { getRarityStyle, formatBonus, formatPillEffectDescription } from '../constants';
import { LockIcon } from './Icons';

interface ItemDetailPopupProps {
    item: GenericItem;
    player: Player;
    gameData: GameData;
    onClose: () => void;
    isInspectionOnly?: boolean;
    owner?: string;
    onEquipItem?: (itemInstanceId: number) => void;
    onUsePill?: (pillId: string) => void;
    onListItem?: (itemInstanceId: number, price: number) => void;
    onListPill?: (pillId: string, quantity: number, price: number) => void;
    onLockItem?: (instanceId: number, lock: boolean) => void;
    onShareItem?: (item: GenericItem) => void;
}

const ListItemModal: React.FC<{
    item: GenericItem;
    onClose: () => void;
    onConfirm: (price: number, quantity?: number) => void;
}> = ({ item, onClose, onConfirm }) => {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('1');

    const isPill = item.itemType === 'pill';
    const maxQuantity = isPill ? (item as Pill & { count: number }).count : 1;

    const handleConfirm = () => {
        const priceNum = parseInt(price, 10);
        const quantityNum = parseInt(quantity, 10);

        if (isPill) {
            if (!isNaN(priceNum) && priceNum > 0 && !isNaN(quantityNum) && quantityNum > 0 && quantityNum <= maxQuantity) {
                onConfirm(priceNum, quantityNum);
            }
        } else {
            if (!isNaN(priceNum) && priceNum > 0) {
                onConfirm(priceNum);
            }
        }
    };

    const isConfirmDisabled = () => {
        const priceNum = parseInt(price, 10);
        if (isNaN(priceNum) || priceNum <= 0) return true;

        if (isPill) {
            const quantityNum = parseInt(quantity, 10);
            if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > maxQuantity) return true;
        }

        return false;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-sm m-4 p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-cyan-300 mb-2">Rao Bán: {item.name}</h2>
                <p className="text-sm text-slate-400 mb-4">Nhập thông tin rao bán.</p>
                
                {isPill && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Số Lượng (Tối đa: {maxQuantity})</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            max={maxQuantity}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                )}
                
                <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1">{isPill ? 'Đơn Giá (mỗi viên)' : 'Giá Bán'}</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Nhập giá bằng Linh Thạch..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-500 text-white">Hủy</button>
                    <button onClick={handleConfirm} disabled={isConfirmDisabled()} className="px-4 py-2 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-500 disabled:cursor-not-allowed">Xác Nhận</button>
                </div>
            </div>
        </div>
    );
};


const ItemDetailPopup: React.FC<ItemDetailPopupProps> = (props) => {
    const { item, owner, onClose, isInspectionOnly = false } = props;
    const [isListingItem, setIsListingItem] = useState(false);
    const rarityId = (item.itemType === 'equipment' || item.itemType === 'pill') ? item.rarity : undefined;
    const { style: rarityStyle, className: rarityClassName } = getRarityStyle(rarityId, props.gameData.RARITIES);

    const handleConfirmListing = (price: number, quantity?: number) => {
        if (item.itemType === 'equipment') {
            props.onListItem?.(item.instance_id, price);
        } else if (item.itemType === 'pill') {
            props.onListPill?.(item.id, quantity!, price);
        }
        setIsListingItem(false);
        onClose();
    };

    const renderItemDetails = () => {
        switch (item.itemType) {
            case 'equipment':
                return (
                    <>
                        <p className="text-xs text-slate-400 mt-1 italic">{item.description}</p>
                        <div className="mt-2 text-xs space-y-1">
                            {item.bonuses.map((bonus, index) => (
                                <p key={index} className="text-cyan-300">{formatBonus(bonus)}</p>
                            ))}
                        </div>
                        {item.smelt_yield > 0 && <p className="text-xs text-amber-300 mt-2">Luyện hóa nhận: {item.smelt_yield} Bụi Luyện Khí</p>}
                    </>
                );
            case 'pill':
                return (
                     <>
                        <p className="text-xs text-slate-400 mt-1 italic">{item.description}</p>
                        <div className="mt-2 text-xs space-y-1">
                            <p className="text-amber-300 font-semibold">Công Dụng:</p>
                            {item.effect.map((eff, index) => (
                                <p key={index} className="text-amber-200 pl-2"> - {formatPillEffectDescription(eff)}</p>
                            ))}
                        </div>
                        <p className="text-xs text-slate-300 mt-2">Số lượng: {item.count}</p>
                    </>
                );
            case 'herb':
                return (
                    <>
                        <p className="text-xs text-slate-400 mt-1 italic">{item.description}</p>
                        <p className="text-xs text-slate-300 mt-2">Số lượng: {item.count}</p>
                    </>
                );
        }
    };

    const renderActionButtons = () => {
        if (isInspectionOnly) {
            return null;
        }
        
        const actionButtonClasses = "px-3 py-1.5 text-sm font-bold rounded-lg text-white transition-colors duration-200 flex items-center justify-center gap-2";
        
        switch (item.itemType) {
            case 'equipment':
                const handleLock = () => {
                    props.onLockItem?.(item.instance_id, !item.is_locked);
                    onClose();
                };
                return (
                    <div className="flex flex-col gap-2 mt-4">
                        <div className="flex gap-2">
                             <button onClick={() => { props.onEquipItem?.(item.instance_id); onClose(); }} className={`flex-1 ${actionButtonClasses} bg-blue-600 hover:bg-blue-700`}>
                                {item.is_equipped ? 'Tháo Ra' : 'Trang Bị'}
                            </button>
                            <button onClick={handleLock} className={`flex-1 ${actionButtonClasses} bg-slate-600 hover:bg-slate-500`}>
                                <LockIcon className="h-4 w-4" /> {item.is_locked ? 'Mở Khóa' : 'Khóa'}
                            </button>
                        </div>
                         {!item.is_equipped && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsListingItem(true)} className={`flex-1 ${actionButtonClasses} bg-amber-600 hover:bg-amber-700`}>Rao Bán</button>
                                <button onClick={() => { props.onShareItem?.(item); onClose(); }} className={`flex-1 ${actionButtonClasses} bg-teal-600 hover:bg-teal-700`}>Chia Sẻ</button>
                            </div>
                        )}
                    </div>
                );
            case 'pill':
                return (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <button onClick={() => { props.onUsePill?.(item.id); onClose(); }} className={`${actionButtonClasses} bg-green-600 hover:bg-green-700`}>Dùng</button>
                        <button onClick={() => setIsListingItem(true)} className={`${actionButtonClasses} bg-amber-600 hover:bg-amber-700`}>Rao Bán</button>
                        <button onClick={() => { props.onShareItem?.(item); onClose(); }} className={`${actionButtonClasses} bg-teal-600 hover:bg-teal-700`}>Chia Sẻ</button>
                    </div>
                );
            case 'herb':
                 return (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                         <button onClick={() => { props.onShareItem?.(item); onClose(); }} className={`${actionButtonClasses} bg-teal-600 hover:bg-teal-700`}>Chia Sẻ</button>
                    </div>
                 );
        }
    };

    return (
        <>
            {isListingItem && (
                <ListItemModal
                    item={item}
                    onClose={() => setIsListingItem(false)}
                    onConfirm={handleConfirmListing}
                />
            )}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4" onClick={onClose}>
                <div className="bg-slate-900 border-2 border-slate-600 rounded-lg shadow-2xl w-full max-w-sm m-4 p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start gap-3 mb-2">
                        {item.icon_url && <img src={item.icon_url} alt={item.name} className="w-12 h-12 flex-shrink-0" />}
                        <h3 className={`font-bold text-lg leading-tight ${rarityClassName || ''}`} style={rarityStyle}>
                            {item.name}
                            {item.itemType === 'equipment' && item.upgrade_level > 0 && (
                                <span className="text-amber-300 ml-2">+{item.upgrade_level}</span>
                            )}
                        </h3>
                    </div>
                    {renderItemDetails()}
                    {owner && <p className="text-xs text-slate-500 mt-2 border-t border-slate-700 pt-2">Chủ sở hữu: <span className="font-semibold text-slate-400">{owner}</span></p>}
                    {renderActionButtons()}
                </div>
            </div>
        </>
    );
};

export default ItemDetailPopup;
