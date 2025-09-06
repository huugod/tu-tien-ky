import { FC, useState, useEffect } from 'react';
import type { AdminStats, AdminMetadata, ColumnDefinition, GenericData } from '../../types';
import Button from '../ui/Button';
import DataManager from '../data/DataManager';
import PlayerManager from '../players/PlayerManager';
import GuildWarManager from '../guild-war/GuildWarManager';
import { API_BASE_URL } from '../../config/config';

interface AdminDashboardProps {
    token: string;
    onLogout: () => void;
}
const AdminDashboard: FC<AdminDashboardProps> = ({ token, onLogout }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [stats, setStats] = useState<AdminStats>({ playerCount: 0, guildCount: 0 });
    const [metadata, setMetadata] = useState<AdminMetadata>({
        bonusTypes: [],
        buffTypes: [],
        equipmentSlots: [],
        itemIds: { pills: [], herbs: [], equipment: [], avatars: [] },
        rarities: [],
        guilds: [],
        insights: [],
        animations: [],
    });
    const [isMetadataLoading, setIsMetadataLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            setIsMetadataLoading(true);
            try {
                const fetchWithAuth = (url: string) => fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

                const checkResponse = async (res: Response, name: string) => {
                    if (!res.ok) {
                        let errorBody = `API call failed with status ${res.status}`;
                        try {
                            const errJson = await res.json();
                            errorBody = errJson.message || JSON.stringify(errJson);
                        } catch (e) {
                             try { errorBody = await res.text(); } catch (readErr) { /* Ignore */ }
                        }
                        throw new Error(`Failed to fetch ${name}: ${errorBody}`);
                    }
                    return res.json();
                };

                const [statsRes, metadataRes] = await Promise.all([
                    fetchWithAuth(`${API_BASE_URL}/admin/stats`),
                    fetchWithAuth(`${API_BASE_URL}/admin/metadata/all`),
                ]);

                const statsData = await checkResponse(statsRes, 'stats');
                const metadataData = await checkResponse(metadataRes, 'all metadata');

                setStats(statsData);
                setMetadata(metadataData);

            } catch (err) {
                console.error("Could not fetch metadata", err);
                alert("Không thể tải dữ liệu meta cho admin panel.\n\nChi tiết: " + (err as Error).message);
            } finally {
                setIsMetadataLoading(false);
            }
        };
        fetchAllData();
    }, [token]);

    const handleReloadData = async () => {
        if (!confirm('Bạn có chắc muốn làm mới dữ liệu game trên server? Hành động này sẽ cập nhật mọi thay đổi cho tất cả người chơi.')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/reload-gamedata`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert('Làm mới dữ liệu thành công!');
        } catch (err) {
            alert('Lỗi: ' + (err as Error).message);
        }
    };

    const navItems = [
        { key: 'dashboard', label: 'Tổng Quan' },
        { key: 'players', label: 'Người Chơi' },
        { key: 'guilds', label: 'Tông Môn' },
        { key: 'guild_wars_manager', label: 'Quản Lý T.M.C' },
        { key: 'market_listings', label: 'Chợ Trang Bị' },
        { key: 'market_listings_pills', label: 'Chợ Đan Dược' },
        { key: 'events', label: 'Sự Kiện' },
        { key: 'announcements', label: 'Thông Báo Chạy Chữ' },
        { key: 'gift_codes', label: 'Giftcode' },
        { type: 'divider', label: 'Dữ Liệu Game' },
        { key: 'game_config', label: 'Cấu Hình Game' },
        { key: 'guild_wars', label: 'Tạo T.M.C' },
        { key: 'pvp_daily_rewards', label: 'Phần Thưởng PvP (Ngày)' },
        { key: 'pvp_weekly_rewards', label: 'Phần Thưởng PvP (Tuần)' },
        { key: 'realms', label: 'Cảnh Giới' },
        { key: 'breakthrough_failure_bonuses', label: 'Phúc Lợi Thất Bại' },
        { key: 'techniques', label: 'Công Pháp' },
        { key: 'equipment', label: 'Trang Bị' },
        { key: 'equipment_upgrades', label: 'Nâng Cấp T.Bị' },
        { key: 'pills', label: 'Đan Dược' },
        { key: 'recipes', label: 'Đan Phương' },
        { key: 'herbs', label: 'Linh Thảo' },
        { key: 'rarities', label: 'Độ Hiếm' },
        { key: 'avatars', label: 'Quản lý Avatar' },
        { key: 'css_animations', label: 'Hiệu Ứng CSS' },
        { key: 'pvp_skills', label: 'Tuyệt Kỹ PvP' },
        { key: 'combat_log_templates', label: 'Lời Thoại Combat' },
        { key: 'trial_zones', label: 'Thí Luyện' },
        { key: 'exploration_locations', label: 'Thám Hiểm' },
        { key: 'insights', label: 'Lĩnh Ngộ' },
        { key: 'spiritual_roots', label: 'Linh Căn' },
        { key: 'honor_shop_items', label: 'Shop Vinh Dự' },
    ];

    const rewardsColumns: ColumnDefinition[] = [
        { name: 'type', label: 'Loại', inputType: 'select', options: [
            { value: 'qi', label: 'Linh Khí (qi)'},
            { value: 'herb', label: 'Linh Thảo (herb)'},
            { value: 'equipment', label: 'Trang Bị (equipment)'},
            { value: 'merit', label: 'Công Đức (merit)'},
            { value: 'linh_thach', label: 'Linh Thạch (linh_thach)'},
            { value: 'avatar', label: 'Avatar (avatar)'},
        ]},
        { name: 'amount', label: 'Số Lượng', type: 'number' },
        { name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs },
        { name: 'equipmentId', label: 'Equipment ID', inputType: 'select', options: metadata.itemIds.equipment },
        { name: 'avatarId', label: 'Avatar ID', inputType: 'select', options: metadata.itemIds.avatars },
        { name: 'chance', label: 'Tỷ Lệ Rơi (0-1)', type: 'number' },
    ];

    const guildWarRewardsColumns: ColumnDefinition[] = [
        { name: 'type', label: 'Loại', inputType: 'select', options: [
            { value: 'linh_thach', label: 'Linh Thạch'},
            { value: 'honor_points', label: 'Điểm Vinh Dự'},
            { value: 'equipment', label: 'Trang Bị'},
            { value: 'pill', label: 'Đan Dược'},
        ]},
        { name: 'amount', label: 'Số Lượng', type: 'number' },
        { 
            name: 'itemId', 
            label: 'Item ID', 
            inputType: 'select', 
            options: (rowData) => {
                if (rowData.type === 'equipment') return metadata.itemIds.equipment;
                if (rowData.type === 'pill') return metadata.itemIds.pills;
                return []; // Return empty for types that don't use itemId
            } 
        },
        { name: 'description', label: 'Mô tả (cho admin)', type: 'text' },
    ];

    const renderView = () => {
        if (isMetadataLoading) return <div>Đang tải dữ liệu cấu hình...</div>;

        const pillEffectColumns: ColumnDefinition[] = [
            { name: 'type', label: 'Loại', inputType: 'select', options: [
                { value: 'instant_qi', label: 'Linh Khí Tức Thời (instant_qi)' },
                ...(metadata.buffTypes || []),
            ]},
            { name: 'amount', label: 'Số lượng (cho instant_qi)', type: 'number' },
            { name: 'value', label: 'Giá trị (cho buff)', type: 'number' },
            { name: 'duration_seconds', label: 'Thời gian (giây)', type: 'number' },
            { name: 'duration_attempts', label: 'Số lần hiệu lực', type: 'number' },
            { name: 'max_stack_value', label: 'Giá trị cộng dồn tối đa', type: 'number' },
            { name: 'consumption_trigger', label: 'Cơ Chế Tiêu Hao', inputType: 'select', options: [
                { value: 'none', label: 'Không (Thời gian/Thủ công)' },
                { value: 'on_breakthrough', label: 'Hao phí khi Đ.Phá' },
                { value: 'on_pvp_fight', label: 'Hao phí khi Đấu Pháp' },
                { value: 'on_guild_war_fight', label: 'Hao phí khi Chiến Bang' }
            ] },
        ];
        
        const pvpSkillEffectColumns: ColumnDefinition[] = [
            { name: 'type', label: 'Loại', inputType: 'select', options: [
                { value: 'damage', label: 'Sát Thương (damage)' },
                { value: 'shield', label: 'Tạo Khiên (shield)' },
                { value: 'dot', label: 'Sát Thương Theo Thời Gian (dot)' },
            ]},
            { name: 'multiplier', label: 'Hệ số (damage)', type: 'number' },
            { name: 'armor_pierce', label: 'Xuyên giáp (damage, 0-1)', type: 'number' },
            { name: 'hp_percent', label: '% máu (shield, 0-1)', type: 'number' },
            { name: 'duration', label: 'Thời gian (lượt, shield/dot)', type: 'number' },
            { name: 'initial_damage_percent', label: '% ST ban đầu (dot, 0-1)', type: 'number' },
            { name: 'dot_damage_percent', label: '% ST mỗi lượt (dot, 0-1)', type: 'number' },
        ];

        const monsterColumns: ColumnDefinition[] = [
            { name: 'name', label: 'Tên Quái', type: 'text' },
            { name: 'health', label: 'HP', type: 'number' },
            { name: 'attack', label: 'ATK', type: 'number' },
        ];
        
        switch (activeView) {
            case 'dashboard': return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-xl text-slate-400">Tổng Số Người Chơi</h3>
                        <p className="text-5xl font-bold text-cyan-300 mt-2">{stats.playerCount}</p>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
                        <h3 className="text-xl text-slate-400">Tổng Số Tông Môn</h3>
                        <p className="text-5xl font-bold text-cyan-300 mt-2">{stats.guildCount}</p>
                    </div>
                </div>
            );
            case 'players': return <PlayerManager token={token} metadata={metadata} />;
            case 'guilds': return <DataManager token={token} tableName="guilds" title="Quản Lý Tông Môn" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên Tông Môn' }, { key: 'leaderName', label: 'Tông Chủ' }, { key: 'level', label: 'Cấp' }, { key: 'memberCount', label: 'Thành Viên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên' }, { name: 'leaderName', label: 'Tông Chủ' }, { name: 'level', label: 'Cấp', type: 'number' }, { name: 'exp', label: 'Kinh Nghiệm', type: 'number' }, { name: 'announcement', label: 'Thông Báo', type: 'textarea' }]} />;
            case 'guild_wars_manager': return <GuildWarManager token={token} />;
            case 'game_config': return <DataManager token={token} tableName="game_config" title="Cấu Hình Game" primaryKey="config_key" displayColumns={[{ key: 'config_key', label: 'Khóa' }, { key: 'config_value', label: 'Giá trị' }]} formFields={[
                { name: 'config_key', label: 'Khóa', isKey: true, readOnly: true }, 
                { 
                    name: 'config_value', 
                    label: 'Giá trị', 
                    type: 'list',
                    objectAsListSingleton: (rowData) => !['GUILD_CREATION_COST', 'KARMA_EFFECTS', 'MERIT_EFFECTS'].includes(rowData.config_key as string),
                    columns: (rowData) => {
                        switch (rowData.config_key) {
                            case 'GUILD_CREATION_COST':
                                return [
                                    { name: 'type', label: 'Loại', inputType: 'select', options: [
                                        { value: 'linh_thach', label: 'Linh Thạch'},
                                        { value: 'qi', label: 'Linh Khí'},
                                        { value: 'merit', label: 'Công Đức'},
                                        { value: 'refinement_dust', label: 'Bụi Luyện Khí' },
                                    ]},
                                    { name: 'amount', label: 'Số Lượng', type: 'number' }
                                ];
                            case 'BODY_STRENGTH_COST':
                                return [
                                    { name: 'base', label: 'Cơ bản', type: 'number' },
                                    { name: 'multiplier', label: 'Hệ số', type: 'number' }
                                ];
                            case 'KARMA_EFFECTS':
                            case 'MERIT_EFFECTS':
                                return [
                                    { name: 'threshold', label: 'Ngưỡng Kích Hoạt', type: 'number' },
                                    { name: 'type', label: 'Loại Bonus', inputType: 'select', options: metadata.bonusTypes },
                                    { name: 'value', label: 'Giá trị (vd: 1.05 cho 5%)', type: 'number' }
                                ];
                            case 'PUNISHMENT_EFFECT':
                                return [
                                    { name: 'type', label: 'Loại Hình Phạt', inputType: 'select', options: [{ value: 'realm_drop', label: 'Rớt Cảnh Giới'}] },
                                    { name: 'value', label: 'Giá trị (số cảnh giới)', type: 'number' }
                                ];
                             case 'PUNISHMENT_KARMA_SCALING':
                                return [
                                    { name: 'rate_per_point', label: 'Tỷ lệ/điểm (vd: 0.0001 = 0.01%)', type: 'number' }
                                ];
                            case 'BREAKTHROUGH_MERIT_SCALING':
                                return [
                                    { name: 'bonus_per_point', label: 'Bonus/điểm (vd: 0.0001 = 0.01%)', type: 'number' }
                                ];
                            case 'MERIT_KARMA_OFFSET_RATE':
                                return [
                                    { name: 'value', label: 'Tỷ lệ bù trừ (1 CĐ trừ ? AN)', type: 'number' }
                                ];
                            case 'OFFLINE_QI_GAIN_RATE':
                                return [
                                    { name: 'value', label: 'Tỷ lệ (vd: 0.5 = 50%)', type: 'number' }
                                ];
                            default: // Handles PVP_COOLDOWN_SECONDS, MARKET_TAX_RATE, etc.
                                return [
                                    { name: 'value', label: 'Giá trị', type: 'number' }
                                ];
                        }
                    }
                }
            ]} />;
            case 'guild_wars': return <DataManager token={token} tableName="guild_wars" title="Tạo Mới Tông Môn Chiến" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên Sự Kiện' }, { key: 'start_time', label: 'Thời Gian Bắt Đầu' }, { key: 'status', label: 'Trạng Thái' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'name', label: 'Tên Sự Kiện' }, { name: 'start_time', label: 'Thời Gian Bắt Đầu', type: 'datetime-local' }, { name: 'status', label: 'Trạng Thái (PENDING, REGISTRATION, IN_PROGRESS, COMPLETED)' }, { name: 'rewards', label: 'Phần thưởng cho Tông Môn thắng', type: 'list', columns: guildWarRewardsColumns }]} />;
            case 'pvp_daily_rewards': return <DataManager token={token} tableName="pvp_daily_rewards" title="Cấu Hình Phần Thưởng PvP (Ngày)" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'rank_start', label: 'Từ Hạng' }, { key: 'rank_end', label: 'Đến Hạng' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, readOnly: true }, { name: 'rank_start', label: 'Từ Hạng', type: 'number' }, { name: 'rank_end', label: 'Đến Hạng', type: 'number' }, { name: 'rewards', label: 'Phần Thưởng', type: 'list', columns: rewardsColumns }]} />;
            case 'pvp_weekly_rewards': return <DataManager token={token} tableName="pvp_weekly_rewards" title="Cấu Hình Phần Thưởng PvP (Tuần)" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'rank_start', label: 'Từ Hạng' }, { key: 'rank_end', label: 'Đến Hạng' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, readOnly: true }, { name: 'rank_start', label: 'Từ Hạng', type: 'number' }, { name: 'rank_end', label: 'Đến Hạng', type: 'number' }, { name: 'rewards', label: 'Phần Thưởng', type: 'list', columns: rewardsColumns }]} />;
            case 'market_listings': return <DataManager token={token} tableName="market_listings" title="Quản Lý Chợ Trang Bị" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'seller_name', label: 'Người Bán' }, { key: 'item_id', label: 'Item Instance ID' }, { key: 'price', label: 'Giá' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'seller_name', label: 'Người Bán' }, { name: 'item_id', label: 'Item Instance ID', type: 'number' }, { name: 'price', label: 'Giá', type: 'number' }, { name: 'expires_at', label: 'Hết Hạn', type: 'datetime-local' }]} />;
            case 'market_listings_pills': return <DataManager token={token} tableName="market_listings_pills" title="Quản Lý Chợ Đan Dược" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'seller_name', label: 'Người Bán' }, { key: 'pill_id', label: 'Pill ID' }, { key: 'quantity', label: 'Số Lượng' }, { key: 'price_per_item', label: 'Đơn Giá' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'seller_name', label: 'Người Bán' }, { name: 'pill_id', label: 'Pill ID', inputType: 'select', options: metadata.itemIds.pills }, { name: 'quantity', label: 'Số Lượng', type: 'number' }, { name: 'price_per_item', label: 'Đơn Giá', type: 'number' }, { name: 'expires_at', label: 'Hết Hạn', type: 'datetime-local' }]} />;
            case 'events': return <DataManager token={token} tableName="events" title="Quản Lý Sự Kiện" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'title', label: 'Tiêu Đề' }, { key: 'is_active', label: 'Kích Hoạt' }]} formFields={[{ name: 'id', label: 'ID', isKey: true }, { name: 'title', label: 'Tiêu Đề' }, { name: 'description', label: 'Mô Tả', type: 'textarea' }, { name: 'bonuses', label: 'Bonuses', type: 'list', columns: [{ name: 'type', label: 'Loại Bonus', inputType: 'select', options: metadata.bonusTypes }, { name: 'value', label: 'Giá trị', type: 'number' }] }, { name: 'starts_at', label: 'Bắt Đầu', type: 'datetime-local' }, { name: 'expires_at', label: 'Kết Thúc', type: 'datetime-local' }, { name: 'is_active', label: 'Kích Hoạt', type: 'boolean' }]} />;
            case 'announcements': return <DataManager token={token} tableName="announcements" title="Quản Lý Thông Báo" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'content', label: 'Nội Dung' }, { key: 'start_time', label: 'Bắt Đầu' }, { key: 'end_time', label: 'Kết Thúc' }, { key: 'is_active', label: 'Hoạt Động' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, readOnly: true }, { name: 'content', label: 'Nội Dung', type: 'textarea' }, { name: 'start_time', label: 'Thời Gian Bắt Đầu', type: 'datetime-local' }, { name: 'end_time', label: 'Thời Gian Kết Thúc', type: 'datetime-local' }, { name: 'is_active', label: 'Kích Hoạt', type: 'boolean' }]} />;
            case 'gift_codes': return <DataManager token={token} tableName="gift_codes" title="Quản Lý Giftcode" primaryKey="code" displayColumns={[{ key: 'code', label: 'Mã' }, { key: 'uses', label: 'Lượt Dùng' }, { key: 'max_uses', label: 'Tối Đa' }]} formFields={[{ name: 'code', label: 'Mã', isKey: true, required: true }, { name: 'rewards', label: 'Phần Thưởng', type: 'list', columns: rewardsColumns }, { name: 'max_uses', label: 'Số Lượt Tối Đa', type: 'number' }, { name: 'expires_at', label: 'Hết Hạn', type: 'datetime-local' }]} />;
            case 'realms': return <DataManager token={token} tableName="realms" title="Quản Lý Cảnh Giới" primaryKey="realmIndex" displayColumns={[{ key: 'realmIndex', label: 'Index' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'realmIndex', label: 'Index', type: 'number', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'qiThreshold', label: 'Linh Khí Cần', type: 'number' }, { name: 'baseQiPerSecond', label: 'Linh Khí/s', type: 'number' }, { name: 'breakthroughChance', label: 'Tỉ Lệ Đột Phá', type: 'number' }, { name: 'baseHp', label: 'HP Gốc', type: 'number' }, { name: 'baseAtk', label: 'ATK Gốc', type: 'number' }, { name: 'baseDef', label: 'DEF Gốc', type: 'number' }, { name: 'baseSpeed', label: 'Tốc Độ Gốc', type: 'number' }, { name: 'baseCritRate', label: 'Tỷ Lệ Bạo Kích Gốc', type: 'number' }, { name: 'baseCritDamage', label: 'ST Bạo Kích Gốc', type: 'number' }, { name: 'baseDodgeRate', label: 'Tỷ Lệ Né Gốc', type: 'number' }]} />;
            case 'breakthrough_failure_bonuses': return <DataManager token={token} tableName="breakthrough_failure_bonuses" title="Quản Lý Phúc Lợi Thất Bại" primaryKey="failure_count" displayColumns={[{ key: 'failure_count', label: 'Lần Thất Bại thứ' }, { key: 'description', label: 'Mô Tả' }]} formFields={[{ name: 'failure_count', label: 'Mốc Thất Bại (lần thứ)', type: 'number', isKey: true, required: true }, { name: 'description', label: 'Mô Tả (cho Admin)' }, { name: 'bonuses', label: 'Phúc Lợi', type: 'list', columns: [{ name: 'type', label: 'Loại Bonus', inputType: 'select', options: metadata.bonusTypes }, { name: 'value', label: 'Giá trị (ví dụ: 0.01 cho 1%)', type: 'number' }] }]} />;
            case 'techniques': return <DataManager token={token} tableName="techniques" title="Quản Lý Công Pháp" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'requiredRealmIndex', label: 'Cảnh Giới Yêu Cầu', type: 'number' }, { name: 'bonuses', label: 'Bonuses', type: 'list', columns: [{ name: 'type', label: 'Loại', inputType: 'select', options: metadata.bonusTypes }, { name: 'value', label: 'Giá trị', type: 'number' }] }]} />;
            case 'equipment': return <DataManager token={token} tableName="equipment" title="Quản Lý Trang Bị" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }, { key: 'slot', label: 'Loại' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'icon_url', label: 'Icon URL', type: 'text' }, { name: 'description', label: 'Mô Tả' }, { name: 'slot', label: 'Loại', inputType: 'select', options: metadata.equipmentSlots }, { name: 'rarity', label: 'Độ hiếm', inputType: 'select', options: metadata.rarities }, { name: 'bonuses', label: 'Bonuses', type: 'list', columns: [{ name: 'type', label: 'Loại', inputType: 'select', options: metadata.bonusTypes }, { name: 'value', label: 'Giá trị', type: 'number' }] }, { name: 'smelt_yield', label: 'Bụi Luyện Khí Nhận Được', type: 'number' }, { name: 'is_upgradable', label: 'Có thể cường hóa?', type: 'boolean' }]} />;
            case 'equipment_upgrades': return <DataManager token={token} tableName="equipment_upgrades" title="Cấu Hình Nâng Cấp T.Bị" primaryKey="upgrade_level" displayColumns={[{ key: 'upgrade_level', label: 'Cấp' }, { key: 'required_dust', label: 'Bụi Yêu Cầu' }, { key: 'success_chance', label: 'Tỷ Lệ Thành Công' }, { key: 'stat_multiplier', label: 'Hệ Số Sức Mạnh' }]} formFields={[{ name: 'upgrade_level', label: 'Cấp', type: 'number', isKey: true, required: true }, { name: 'required_dust', label: 'Bụi Yêu Cầu', type: 'number' }, { name: 'success_chance', label: 'Tỷ Lệ Thành Công (0-1)', type: 'number' }, { name: 'stat_multiplier', label: 'Hệ Số Sức Mạnh (vd: 1.1 cho +10%)', type: 'number' }]} />;
            case 'pills': return <DataManager token={token} tableName="pills" title="Quản Lý Đan Dược" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'icon_url', label: 'Icon URL', type: 'text' }, { name: 'description', label: 'Mô Tả' }, { name: 'rarity', label: 'Độ hiếm', inputType: 'select', options: metadata.rarities }, { name: 'effect', label: 'Hiệu Ứng', type: 'list', columns: pillEffectColumns }]} />;
            case 'recipes': return <DataManager token={token} tableName="recipes" title="Quản Lý Đan Phương" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'pillId', label: 'Pill ID', inputType: 'select', options: metadata.itemIds.pills }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'requiredRealmIndex', label: 'Cảnh Giới Yêu Cầu', type: 'number' }, { name: 'qiCost', label: 'Linh Khí Tốn', type: 'number' }, { name: 'herbCosts', label: 'Nguyên Liệu', objectAsList: { keyName: 'herbId', valueName: 'amount', valueType: 'number' }, columns: [{ name: 'herbId', label: 'Herb ID', inputType: 'select', options: metadata.itemIds.herbs }, { name: 'amount', label: 'Số lượng', type: 'number' }] }, { name: 'successChance', label: 'Tỉ Lệ Thành Công', type: 'number' }]} />;
            case 'herbs': return <DataManager token={token} tableName="herbs" title="Quản Lý Linh Thảo" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'icon_url', label: 'Icon URL', type: 'text' }, { name: 'description', label: 'Mô Tả' }]} />;
            case 'rarities': return <DataManager token={token} tableName="rarities" title="Quản Lý Độ Hiếm" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên', required: true }, { name: 'style', label: 'Style (CSS)', type: 'list', objectAsListSingleton: true, columns: [{ name: 'css', label: 'CSS Background/Color' }, { name: 'animation', label: 'Animation Class (Optional)', inputType: 'select', options: metadata.animations }] }]} />;
            case 'avatars': return <DataManager token={token} tableName="avatars" title="Quản Lý Avatar" displayColumns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Tên'}, {key: 'url', label: 'URL'}]} formFields={[{name: 'id', label: 'ID', isKey: true, required: true}, {name: 'name', label: 'Tên'}, {name: 'url', label: 'URL hình ảnh'}, {name: 'description', label: 'Mô tả', type: 'textarea'}]} />;
            case 'css_animations': return <DataManager token={token} tableName="css_animations" title="Quản Lý Hiệu Ứng CSS" primaryKey="class_name" displayColumns={[{ key: 'class_name', label: 'Tên Class' }]} formFields={[{ name: 'class_name', label: 'Tên Class', isKey: true, required: true }, { name: 'keyframes_css', label: 'Nội Dung CSS (@keyframes và class)', type: 'textarea' }]} />;
            case 'pvp_skills': return <DataManager token={token} tableName="pvp_skills" title="Quản Lý Tuyệt Kỹ PvP" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'cost', label: 'Giá (Điểm Vinh Dự)', type: 'number' }, { name: 'energy_cost', label: 'Sát Khí Tốn', type: 'number' }, { name: 'effect', label: 'Hiệu Ứng', type: 'list', columns: pvpSkillEffectColumns }]} />;
            case 'combat_log_templates': return <DataManager token={token} tableName="combat_log_templates" title="Quản Lý Lời Thoại Combat" primaryKey="id" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'type', label: 'Loại' }, { key: 'template', label: 'Mẫu Câu' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, readOnly: true }, { name: 'type', label: 'Loại Hành Động', inputType: 'select', options: [{value: 'NORMAL_HIT', label: 'Đánh Thường'}, {value: 'CRITICAL_HIT', label: 'Chí Mạng'}, {value: 'DODGE', label: 'Né Tránh'}, {value: 'SHIELD_ABSORB', label: 'Khiên Đỡ'}, {value: 'LIFESTEAL', label: 'Hút Máu'}, {value: 'COUNTER_ATTACK', label: 'Phản Đòn'}, {value: 'SKILL_DAMAGE', label: 'Sát Thương Kỹ Năng'}, {value: 'SKILL_EFFECT', label: 'Hiệu Ứng Kỹ Năng'}, {value: 'INFO', label: 'Thông Báo Chung'}, {value: 'ATTACKER_FINISHER', label: 'Đòn Kết Liễu (Kẻ Tấn Công)'}, {value: 'DEFENDER_FINISHER', label: 'Đòn Kết Liễu (Kẻ Phòng Thủ)'}, {value: 'PVP_WIN_SUMMARY', label: 'Tóm Tắt Thắng PvP'}, {value: 'PVP_LOSE_SUMMARY', label: 'Tóm Tắt Thua PvP'}] }, { name: 'template', label: 'Mẫu câu thoại', type: 'textarea' }]} />;
            case 'trial_zones': return <DataManager token={token} tableName="trial_zones" title="Quản Lý Thí Luyện" displayColumns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Tên' }, { key: 'type', label: 'Loại' }]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true }, { name: 'name', label: 'Tên' }, { name: 'description', label: 'Mô Tả' }, { name: 'type', label: 'Loại (NORMAL, MERIT)' }, { name: 'requiredRealmIndex', label: 'Cảnh giới YC', type: 'number' }, { name: 'cooldownSeconds', label: 'Hồi chiêu (s)', type: 'number' }, { name: 'monster', label: 'Quái', type: 'list', columns: monsterColumns }, { name: 'rewards', label: 'Phần thưởng', type: 'list', columns: rewardsColumns }]} />;
            case 'exploration_locations': return <DataManager token={token} tableName="exploration_locations" title="Quản Lý Thám Hiểm" displayColumns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Tên'}]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true}, {name: 'name', label: 'Tên'}, {name: 'description', label: 'Mô Tả', type: 'textarea'}, {name: 'requiredRealmIndex', label: 'Cảnh Giới YC', type: 'number'}, {name: 'requiredBodyStrength', label: 'Luyện Thể YC', type: 'number'}, {name: 'durationSeconds', label: 'Thời Gian (giây)', type: 'number'}, { name: 'rewards', label: 'Phần Thưởng', type: 'list', columns: rewardsColumns }]} />;
            case 'insights': return <DataManager token={token} tableName="insights" title="Quản Lý Lĩnh Ngộ" displayColumns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Tên'}]} formFields={[
                { name: 'id', label: 'ID', isKey: true, required: true}, 
                {name: 'name', label: 'Tên'}, 
                {name: 'description', label: 'Mô Tả', type: 'textarea'}, 
                {name: 'cost', label: 'Giá (Điểm Lĩnh Ngộ)', type: 'number'}, 
                {name: 'requiredInsightIds', label: 'Thiên Phú YC', type: 'list', arrayAsList: { valueName: 'id' }, columns: [{ name: 'id', label: 'Thiên Phú', inputType: 'select', options: metadata.insights }]}, 
                {name: 'bonus', label: 'Bonus', type: 'list', objectAsListSingleton: true, columns: [
                    { name: 'type', label: 'Loại', inputType: 'select', options: metadata.bonusTypes },
                    { name: 'value', label: 'Giá trị', type: 'number' }
                ]}
            ]} />;
            case 'spiritual_roots': return <DataManager token={token} tableName="spiritual_roots" title="Quản Lý Linh Căn" displayColumns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Tên'}]} formFields={[
                { name: 'id', label: 'ID', isKey: true, required: true}, 
                {name: 'name', label: 'Tên'}, 
                {name: 'description', label: 'Mô Tả', type: 'textarea'},
                {
                    name: 'bonus', 
                    label: 'Bonus', 
                    type: 'list', 
                    columns: [
                        { 
                            name: 'type', 
                            label: 'Loại Bonus', 
                            inputType: 'select', 
                            options: metadata.bonusTypes
                        },
                        { name: 'value', label: 'Giá trị', type: 'number' }
                    ]
                }
            ]} />;
            case 'honor_shop_items': return <DataManager token={token} tableName="honor_shop_items" title="Quản Lý Shop Vinh Dự" displayColumns={[{key: 'id', label: 'ID'}, {key: 'name', label: 'Tên'}]} formFields={[{ name: 'id', label: 'ID', isKey: true, required: true}, { name: 'type', label: 'Loại', inputType: 'select', options: [{value: 'equipment', label: 'Trang Bị'}, {value: 'pill', label: 'Đan Dược'}]}, { name: 'itemId', label: 'Item ID', inputType: 'select', options: (formData: GenericData) => { if(formData.type === 'equipment') return metadata.itemIds.equipment; if(formData.type === 'pill') return metadata.itemIds.pills; return []; } }, {name: 'name', label: 'Tên Hiển Thị'}, {name: 'description', label: 'Mô tả', type: 'textarea'}, {name: 'cost', label: 'Giá (Điểm Vinh Dự)', type: 'number'}, {name: 'isUnique', label: 'Là duy nhất?', type: 'boolean'}]} />;
            default: return <div>Chọn một mục để quản lý</div>
        }
    };

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 bg-slate-900 text-slate-300 p-4 flex flex-col flex-shrink-0">
                <h1 className="text-2xl font-bold text-cyan-300 text-center mb-8">Admin Panel</h1>
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {navItems.map(item => item.type === 'divider' ?
                            <li key={item.label} className="pt-4 pb-2 text-sm uppercase text-slate-500 font-semibold tracking-wider">{item.label}</li> :
                            <li key={item.key}>
                                <button onClick={() => setActiveView(item.key!)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === item.key ? 'bg-cyan-500/10 text-cyan-300' : 'hover:bg-slate-700/50'}`}>
                                    {item.label}
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="flex-shrink-0 space-y-2">
                    <Button onClick={handleReloadData} className="w-full bg-amber-600 hover:bg-amber-500">⚡ Làm Mới Dữ Liệu</Button>
                    <Button onClick={onLogout} className="w-full bg-slate-600 hover:bg-slate-500">Đăng Xuất</Button>
                </div>
            </aside>
            <main className="flex-grow p-8 bg-slate-900/80">
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboard;