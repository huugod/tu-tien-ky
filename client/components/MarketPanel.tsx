import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { MarketListing, Player, GameData, MarketListingEquipment, MarketListingPill } from '../types';
import { formatNumber, getRarityStyle, formatBonus } from '../constants';
import { API_BASE_URL } from '../config/config';

interface MarketPanelProps {
    token: string | null;
    player: Player;
    gameData: GameData;
    onAction: (endpoint: string, body?: object) => Promise<boolean | void>;
    showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const MarketPanel: React.FC<MarketPanelProps> = ({ token, player, gameData, onAction, showConfirmation }) => {
    const [activeTab, setActiveTab] = useState<'shop' | 'my_shop'>('shop');
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [myListings, setMyListings] = useState<MarketListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const [listingsRes, myListingsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/market/listings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/market/my-listings`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!listingsRes.ok || !myListingsRes.ok) {
                throw new Error('Không thể tải dữ liệu Chợ.');
            }

            setListings(await listingsRes.json());
            setMyListings(await myListingsRes.json());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBuyItem = (listing: MarketListing) => {
        const isPill = listing.listing_type === 'pill';
        const totalPrice = isPill ? (listing as MarketListingPill).price_per_item * (listing as MarketListingPill).quantity : (listing as MarketListingEquipment).price;
        const itemName = isPill ? `${listing.item.name} x${(listing as MarketListingPill).quantity}` : listing.item.name;

        showConfirmation(
            'Xác nhận mua',
            `Bạn có chắc muốn mua [${itemName}] với giá ${formatNumber(totalPrice)} Linh Thạch không?`,
            async () => {
                const endpoint = isPill ? `/market/buy-pill/${listing.id}` : `/market/buy/${listing.id}`;
                const success = await onAction(endpoint);
                if (success) fetchData();
            }
        );
    };

    const handleCancelListing = (listing: MarketListing) => {
        const isPill = listing.listing_type === 'pill';
        showConfirmation(
            'Xác nhận hủy bán',
            `Bạn có chắc muốn hủy bán [${listing.item.name}]?`,
            async () => {
                const endpoint = isPill ? `/market/cancel-pill/${listing.id}` : `/market/cancel/${listing.id}`;
                const success = await onAction(endpoint);
                if (success) fetchData();
            }
        );
    };
    
    const filteredAndSortedListings = useMemo(() => {
        return listings
            .filter(l => l.item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const priceA = a.listing_type === 'pill' ? a.price_per_item * a.quantity : a.price;
                const priceB = b.listing_type === 'pill' ? b.price_per_item * b.quantity : b.price;

                switch (sortBy) {
                    case 'price_asc': return priceA - priceB;
                    case 'price_desc': return priceB - priceA;
                    case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    default: return 0;
                }
            });
    }, [listings, searchTerm, sortBy]);
    

    const renderListingItem = (listing: MarketListing, isMyItem: boolean) => {
        const { style: rarityStyle, className: rarityClassName } = getRarityStyle(listing.item.rarity, gameData.RARITIES);
        const isPill = listing.listing_type === 'pill';
        const pillListing = isPill ? (listing as MarketListingPill) : null;
        const equipmentListing = !isPill ? (listing as MarketListingEquipment) : null;
        const totalPrice = isPill ? pillListing!.price_per_item * pillListing!.quantity : equipmentListing!.price;

        return (
             <div key={`${listing.listing_type}-${listing.id}`} className={`bg-slate-800/60 p-3 rounded-lg border border-slate-700 ${isMyItem && activeTab === 'shop' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                    {listing.item.icon_url && <img src={listing.item.icon_url} alt={listing.item.name} className="w-12 h-12 flex-shrink-0" />}
                    <div className="flex-grow">
                        <h4 className={`font-bold ${rarityClassName || ''}`} style={rarityStyle}>
                            {listing.item.name}
                            {equipmentListing && equipmentListing.item.upgrade_level > 0 && <span className="text-amber-300 ml-1">+{equipmentListing.item.upgrade_level}</span>}
                            {isPill && ` x${pillListing!.quantity}`}
                        </h4>

                        <div className="mt-1 text-xs space-y-1 min-h-[1rem]">
                            {equipmentListing && equipmentListing.item.bonuses.map((bonus, index) => (
                                <p key={index} className="text-cyan-300">{formatBonus(bonus)}</p>
                            ))}
                            {isPill && <p className="text-slate-400 italic">{listing.item.description}</p>}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-500 mt-2">Người bán: {listing.seller_name}</p>

                <div className="flex justify-between items-center mt-3">
                    <span className="font-bold text-lg text-yellow-400">
                        {formatNumber(totalPrice)}
                        {isPill && <span className="text-xs text-slate-400 ml-1">({formatNumber(pillListing!.price_per_item)}/cái)</span>}
                    </span>
                    {isMyItem ? (
                        <button onClick={() => handleCancelListing(listing)} className="px-4 py-1 text-sm font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white">Hủy Bán</button>
                    ) : (
                        <button onClick={() => handleBuyItem(listing)} className="px-4 py-1 text-sm font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white">Mua</button>
                    )}
                </div>
            </div>
        )
    };

    const renderShop = () => (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-cyan-500"
                />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-cyan-500">
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                </select>
            </div>
            <div className="overflow-y-auto pr-2 space-y-3 flex-grow h-96 scrollbar-main">
                {isLoading ? <p className="text-center">Đang tải...</p> : 
                 filteredAndSortedListings.length > 0 ? filteredAndSortedListings.map(listing => renderListingItem(listing, listing.seller_name === player.name)) :
                 <p className="text-center text-slate-500 pt-8">Chợ hiện không có vật phẩm nào.</p>}
            </div>
        </div>
    );

    const renderMyShop = () => (
        <div className="overflow-y-auto pr-2 space-y-3 flex-grow h-[28rem] scrollbar-main">
            {isLoading ? <p className="text-center">Đang tải...</p> :
             myListings.length > 0 ? myListings.map(l => renderListingItem(l, true)) :
             <p className="text-center text-slate-500 pt-8">Bạn chưa đăng bán vật phẩm nào.</p>}
        </div>
    );
    
    const getTabClass = (tabName: 'shop' | 'my_shop') => {
        return `flex-1 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === tabName 
            ? 'text-cyan-300 border-b-2 border-cyan-400 bg-slate-800/50' 
            : 'text-slate-400 hover:text-white'
        }`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-slate-700 flex-shrink-0">
                <button onClick={() => setActiveTab('shop')} className={getTabClass('shop')}>Mua Sắm</button>
                <button onClick={() => setActiveTab('my_shop')} className={getTabClass('my_shop')}>Cửa Hàng Của Tôi</button>
            </div>
             <div className="flex-grow min-h-0 pt-4">
                {error && <p className="text-red-400 text-center">{error}</p>}
                {activeTab === 'shop' && renderShop()}
                {activeTab === 'my_shop' && renderMyShop()}
            </div>
        </div>
    );
};

export default MarketPanel;