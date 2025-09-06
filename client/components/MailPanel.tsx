import React, { useState, useEffect, useCallback } from 'react';
import type { MailItem, GameData, Reward } from '../types';
import { API_BASE_URL } from '../config/config';
import { getRarityStyle } from '../constants';

interface MailPanelProps {
    token: string | null;
    gameData: GameData;
    onAction: (endpoint: string, body?: object, method?: 'POST' | 'GET') => Promise<boolean | void>;
    onRefreshPlayer: () => void;
}

const MailPanel: React.FC<MailPanelProps> = ({ token, gameData, onAction, onRefreshPlayer }) => {
    const [mails, setMails] = useState<MailItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);

    const fetchMails = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/mail`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể tải thư.');
            setMails(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMails();
    }, [fetchMails]);

    const handleSelectMail = async (mail: MailItem) => {
        setSelectedMail(mail);
        if (!mail.is_read) {
            await fetch(`${API_BASE_URL}/mail/${mail.id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMails(prev => prev.map(m => m.id === mail.id ? { ...m, is_read: true } : m));
            onRefreshPlayer(); // Refresh unread count in main UI
        }
    };

    const handleClaim = async (mailId: number) => {
        const success = await onAction(`/mail/${mailId}/claim`);
        if (success) {
            setSelectedMail(prev => prev ? { ...prev, rewards: [] } : null);
            fetchMails(); // Re-fetch to get updated mail list
        }
    };

    const handleDelete = async (mailId: number) => {
        await fetch(`${API_BASE_URL}/mail/${mailId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setMails(prev => prev.filter(m => m.id !== mailId));
        setSelectedMail(null);
        onRefreshPlayer();
    };
    
    const handleClaimAll = async () => {
        const success = await onAction('/mail/claim-all');
        if (success) {
            fetchMails();
            onRefreshPlayer();
        }
    };
    
    const renderReward = (reward: Reward, key: number) => {
        let text = '';
        let item: { id?: string, rarity?: string, name?: string, icon_url?: string } | null = null;

        switch (reward.type) {
            case 'qi': text = `${reward.amount.toLocaleString()} Linh Khí`; break;
            case 'linh_thach': text = `${reward.amount.toLocaleString()} Linh Thạch`; break;
            case 'honor_points': text = `${reward.amount.toLocaleString()} Điểm Vinh Dự`; break;
            case 'herb': item = gameData.HERBS.find(h => h.id === reward.herbId) || null; text = `${item?.name} x${reward.amount}`; break;
            case 'equipment': item = gameData.EQUIPMENT.find(e => e.id === reward.equipmentId) || null; text = `[${item?.name}]`; break;
            case 'avatar': item = gameData.AVATARS.find(a => a.id === reward.avatarId) || null; text = `Pháp Tướng [${item?.name}]`; break;
            case 'pill': item = gameData.PILLS.find(p => p.id === reward.itemId) || null; text = `${item?.name} x${reward.amount}`; break;
            default: return null;
        }

        const { style, className } = getRarityStyle(item?.rarity, gameData.RARITIES, 'text');

        return (
            <div key={key} className="flex items-center gap-2 bg-slate-800 p-2 rounded-md">
                {item?.icon_url && <img src={item.icon_url} alt={item.name} className="w-8 h-8"/>}
                <span className={`text-sm ${className || ''}`} style={style}>{text}</span>
            </div>
        );
    };

    if (isLoading) return <p className="text-center">Đang tải hòm thư...</p>;

    if (selectedMail) {
        const hasRewards = selectedMail.rewards && selectedMail.rewards.length > 0;
        return (
            <div className="flex flex-col h-full text-slate-300">
                <button onClick={() => setSelectedMail(null)} className="text-sm text-cyan-400 self-start mb-2">← Quay lại danh sách</button>
                <div className="flex-grow bg-slate-900/50 p-4 rounded-lg border border-slate-700 overflow-y-auto scrollbar-modal">
                    <h3 className="text-xl font-bold text-white mb-2">{selectedMail.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">{new Date(selectedMail.created_at).toLocaleString('vi-VN')}</p>
                    <p className="text-sm whitespace-pre-wrap mb-6">{selectedMail.content}</p>
                    
                    {hasRewards && (
                        <>
                            <h4 className="font-semibold text-emerald-400 mb-2">Vật phẩm đính kèm:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                                {selectedMail.rewards.map((r, i) => renderReward(r, i))}
                            </div>
                            <button onClick={() => handleClaim(selectedMail.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Nhận</button>
                        </>
                    )}
                </div>
                {selectedMail.is_read && !hasRewards && (
                    <button onClick={() => handleDelete(selectedMail.id)} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4">Xóa Thư</button>
                )}
            </div>
        );
    }

    const canClaimAll = mails.some(m => m.rewards && m.rewards.length > 0);

    return (
        <div className="flex flex-col h-full">
            {mails.length === 0 ? (
                <p className="text-center text-slate-500 pt-16">Hòm thư của bạn trống.</p>
            ) : (
                <>
                    <div className="flex justify-end mb-2 flex-shrink-0">
                        <button onClick={handleClaimAll} disabled={!canClaimAll} className="px-4 py-1 text-sm font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Nhận Nhanh
                        </button>
                    </div>
                    <div className="overflow-y-auto pr-2 space-y-2 flex-grow scrollbar-main">
                        {mails.map(mail => (
                            <button key={mail.id} onClick={() => handleSelectMail(mail)} className={`w-full text-left p-3 rounded-lg border transition-colors ${mail.is_read ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-700/70 border-cyan-700 hover:bg-slate-700'}`}>
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-semibold ${!mail.is_read ? 'text-white' : 'text-slate-400'}`}>{mail.title}</h4>
                                    {mail.rewards && mail.rewards.length > 0 && (
                                        <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">Có Vật Phẩm</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{new Date(mail.created_at).toLocaleString('vi-VN')}</p>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MailPanel;
