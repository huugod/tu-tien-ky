import { FC, useState, useEffect, useCallback } from 'react';
import type { GenericData, FormField, AdminMetadata } from '../../types';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import EditForm from '../data/EditForm';
import { API_BASE_URL } from '../../config/config';

interface PlayerData {
    name: string;
    realmIndex: number;
    combat_power: number;
    is_banned: boolean;
    [key: string]: any;
}
interface PlayerManagerProps {
    token: string;
    metadata: AdminMetadata;
}
const PlayerManager: FC<PlayerManagerProps> = ({ token, metadata }) => {
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [search, setSearch] = useState('');
    const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const fetchPlayers = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/players?search=${search}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setPlayers(data);
        } catch (err) {
            alert('Lỗi tìm người chơi: ' + (err as Error).message);
        }
    }, [token, search]);

    useEffect(() => {
        const handler = setTimeout(() => fetchPlayers(), 300);
        return () => clearTimeout(handler);
    }, [fetchPlayers]);

    const handleSave = async (playerData: GenericData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/players/${playerData.name}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(playerData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            setEditingPlayer(null);
            fetchPlayers();
        } catch (err) {
            alert('Lỗi cập nhật người chơi: ' + (err as Error).message);
        }
    };

    const handleEditClick = async (playerSummary: PlayerData) => {
        setEditingPlayer({ ...playerSummary }); 
        setIsLoadingDetails(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/player/${playerSummary.name}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Không thể tải dữ liệu người chơi.');
            }
            const fullPlayerData = await res.json();
            setEditingPlayer(fullPlayerData);
        } catch (err) {
            alert('Lỗi tải chi tiết người chơi: ' + (err as Error).message);
            setEditingPlayer(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const playerFormFields: FormField[] = [
        { name: 'name', label: 'Tên', isKey: true, readOnly: true },
        { name: 'combat_power', label: 'Lực Chiến', type: 'number', readOnly: true },
        { name: 'qi', label: 'Linh Khí', type: 'number' },
        { name: 'linh_thach', label: 'Linh Thạch', type: 'number' },
        { name: 'refinement_dust', label: 'Bụi Luyện Khí', type: 'number' },
        { name: 'realmIndex', label: 'Cảnh Giới (Index)', type: 'number' },
        { name: 'bodyStrength', label: 'Luyện Thể', type: 'number' },
        { name: 'karma', label: 'Ác Nghiệp', type: 'number' },
        { name: 'merit', label: 'Công Đức', type: 'number' },
        { name: 'honorPoints', label: 'Điểm Vinh Dự', type: 'number' },
        { name: 'enlightenmentPoints', label: 'Điểm Lĩnh Ngộ', type: 'number' },
        { name: 'guildId', label: 'Tông Môn', inputType: 'select', options: metadata.guilds },
        { name: 'guild_role', label: 'Chức Vụ', inputType: 'select', options: [
            { value: 'leader', label: 'Tông Chủ'},
            { value: 'vice_leader', label: 'Phó Tông Chủ'},
            { value: 'elite', label: 'Trưởng Lão'},
            { value: 'member', label: 'Thành Viên'},
        ]},
        { name: 'guild_contribution', label: 'Điểm Cống Hiến', type: 'number' },
        { name: 'is_banned', label: 'Đã Khóa', type: 'boolean' },
        { name: 'ban_reason', label: 'Lý Do Khóa', type: 'textarea' },
        { name: 'registration_ip', label: 'IP Đăng Ký', readOnly: true },
        { name: 'last_login_ip', label: 'IP Đăng Nhập Cuối', readOnly: true },
        { name: 'registration_client_id', label: 'Client ID Đăng Ký', readOnly: true },
        { name: 'last_login_client_id', label: 'Client ID Cuối', readOnly: true },
        { name: 'equipped_avatar_id', label: 'Avatar Đang Dùng', inputType: 'select', options: metadata.itemIds.avatars },
        { name: 'unlocked_avatars', label: 'Avatars Đã Mở', type: 'list', arrayAsList: { valueName: 'id' }, columns: [{ name: 'id', label: 'Avatar ID', inputType: 'select', options: metadata.itemIds.avatars }] },
        { name: 'active_buffs', label: 'Buff Hiện Có (JSON)', type: 'json' },
        { name: 'pills', label: 'Đan Dược', objectAsList: { keyName: 'pillId', valueName: 'amount', valueType: 'number' }, columns: [{ name: 'pillId', label: 'Pill ID', inputType: 'select', options: metadata.itemIds.pills }, { name: 'amount', label: 'Số Lượng', type: 'number' }] },
        { name: 'herbs', label: 'Linh Thảo', objectAsList: { keyName: 'herbId', valueName: 'amount', valueType: 'number' }, columns: [{ name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs }, { name: 'amount', label: 'Số Lượng', type: 'number' }] },
        // NEW: Interactive editors for inventory and equipment
        { name: 'equipment', label: 'Trang Bị (Đang mặc)', type: 'list', columns: [
            { name: 'instance_id', label: 'Instance ID', readOnly: true },
            { name: 'id', label: 'Item ID', inputType: 'select', options: metadata.itemIds.equipment },
            { name: 'slot', label: 'Slot', readOnly: true },
            { name: 'upgrade_level', label: 'Cấp CH', type: 'number' },
            { name: 'is_locked', label: 'Khóa?', type: 'boolean' },
        ]},
        { name: 'inventory', label: 'Túi Đồ (Chưa mặc)', type: 'list', columns: [
            { name: 'instance_id', label: 'Instance ID', readOnly: true },
            { name: 'id', label: 'Item ID', inputType: 'select', options: metadata.itemIds.equipment },
            { name: 'upgrade_level', label: 'Cấp CH', type: 'number' },
            { name: 'is_locked', label: 'Khóa?', type: 'boolean' },
        ]},
    ];

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-cyan-300 mb-4">Quản Lý Người Chơi</h2>
            <Input label="Tìm theo tên" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập tên người chơi..." />
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-3">Tên</th>
                            <th className="px-6 py-3">Cảnh Giới</th>
                            <th className="px-6 py-3">Lực Chiến</th>
                            <th className="px-6 py-3">Trạng Thái</th>
                            <th className="px-6 py-3 text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map(p => (
                            <tr key={p.name} className="border-b border-slate-700 hover:bg-slate-800">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="flex items-center gap-2">
                                        {p.name}
                                        {p.is_banned ? <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">BAN</span> : null}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{p.realmIndex}</td>
                                <td className="px-6 py-4 font-semibold text-amber-300">{p.combat_power.toLocaleString('vi-VN')}</td>
                                <td className="px-6 py-4">{p.is_banned ? <span className="text-red-400 font-bold">Đã Khóa</span> : <span className="text-green-400">Hoạt Động</span>}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleEditClick(p)} className="font-medium text-blue-400 hover:underline">Sửa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingPlayer && (
                <Modal title={`Sửa Người Chơi: ${editingPlayer.name}`} onClose={() => setEditingPlayer(null)}>
                    {isLoadingDetails ? (
                        <div className="text-center p-8">Đang tải chi tiết người chơi...</div>
                    ) : (
                        <EditForm initialData={editingPlayer} formFields={playerFormFields} onSave={handleSave} onCancel={() => setEditingPlayer(null)} primaryKey="name" />
                    )}
                </Modal>
            )}
        </div>
    )
}

export default PlayerManager;