import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Player, GameData, GuildMember, GuildApplication, GuildRole } from '../types';
import { getGuildNextLevelExp, formatNumber, getGuildMemberLimit } from '../constants';
import { API_BASE_URL } from '../config/config';

interface Guild {
    id: number;
    name: string;
    leaderName: string;
    level: number;
    memberCount: number;
    announcement?: string;
    hasApplied?: boolean;
}

interface GuildDetails extends Guild {
    exp: number | string;
    members: GuildMember[];
}

interface GuildPanelProps {
    player: Player;
    token: string | null;
    onAction: (endpoint: string, body?: object) => Promise<boolean | void>;
    onInspectPlayer: (name: string) => void;
    showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
    gameData: GameData;
}

const ROLES: Record<GuildRole, string> = {
    leader: 'Tông Chủ',
    vice_leader: 'Phó Tông Chủ',
    elite: 'Trưởng Lão',
    member: 'Thành Viên',
};
const ROLE_HIERARCHY: Record<GuildRole, number> = {
    leader: 4,
    vice_leader: 3,
    elite: 2,
    member: 1,
};

// --- Prop Types for Sub-components ---
interface InfoTabProps {
    player: Player;
    guild: GuildDetails;
    contributionAmount: string;
    setContributionAmount: (value: string) => void;
    onContribute: () => void;
    onLeave: () => void;
    onActionWithRefresh: (endpoint: string, body?: object) => void;
}

interface MembersTabProps {
    members: GuildMember[];
    onInspectPlayer: (name: string) => void;
    currentPlayer: Player;
    onActionWithRefresh: (endpoint: string, body?: object) => void;
    showConfirmationWithRefresh: (title: string, message: string, endpoint: string) => void;
    gameData: GameData;
}

interface ApplicationsTabProps {
    applications: GuildApplication[];
    onActionWithRefresh: (endpoint: string, body?: object) => void;
    gameData: GameData;
}

interface ContributionRankingTabProps {
    members: GuildMember[];
}

interface AnnouncementModalProps {
    initialText: string;
    onClose: () => void;
    onSave: (text: string) => void;
}


const GuildPanel: React.FC<GuildPanelProps> = ({ player, token, onAction, onInspectPlayer, showConfirmation, gameData }) => {
    
    // For players without a guild
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [newGuildName, setNewGuildName] = useState('');
    const [applyingTo, setApplyingTo] = useState<number | null>(null);

    // For players in a guild
    const [guildDetails, setGuildDetails] = useState<GuildDetails | null>(null);
    const [applications, setApplications] = useState<GuildApplication[]>([]);
    const [contributionAmount, setContributionAmount] = useState('1000');
    const [activeTab, setActiveTab] = useState<'info' | 'members' | 'apps' | 'ranking' | 'browse'>('info');
    const [allGuilds, setAllGuilds] = useState<Guild[]>([]); // For browsing

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            if (player.guildId) {
                const [detailsRes, appsRes, allGuildsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/guilds/details/${player.guildId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/guilds/applications`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/guilds/list`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (!detailsRes.ok) throw new Error('Không thể tải thông tin Tông Môn.');
                setGuildDetails(await detailsRes.json());
                if (appsRes.ok) setApplications(await appsRes.json());
                if (allGuildsRes.ok) setAllGuilds(await allGuildsRes.json());
            } else {
                const res = await fetch(`${API_BASE_URL}/guilds/list-with-app-status`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Không thể tải danh sách Tông Môn.');
                setGuilds(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    }, [token, player.guildId]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async () => {
        if (newGuildName.trim()) {
            const success = await onAction('/guilds/create', { guildName: newGuildName.trim() });
            if (success) {
                setNewGuildName('');
            }
        }
    };

    const handleApply = async (guildId: number) => {
        setApplyingTo(guildId);
        const success = await onAction(`/guilds/apply/${guildId}`);
        if (success) {
            await fetchData(); 
        }
        setApplyingTo(null);
    };

    const creationCosts = useMemo(() => gameData.GUILD_CREATION_COST || [], [gameData]);

    const canCreateGuild = useMemo(() => {
        if (!creationCosts || creationCosts.length === 0) return false;
        return creationCosts.every((cost: { type: keyof Player, amount: number }) => {
            const playerResource = player[cost.type];
            const resourceValue = Number(playerResource);
            if (!isNaN(resourceValue)) {
                return resourceValue >= cost.amount;
            }
            return false;
        });
    }, [player, creationCosts]);

    const resourceTypeToName: Record<string, string> = {
        linh_thach: 'Linh Thạch',
        qi: 'Linh Khí',
        merit: 'Công Đức',
        karma: 'Ác Nghiệp',
        refinement_dust: 'Bụi Luyện Khí',
    };
    
    if (player.guildId && player.guild_role && guildDetails) {
        const canManageApps = ROLE_HIERARCHY[player.guild_role] >= ROLE_HIERARCHY.elite;
        const getTabClass = (tabName: string) => `flex-1 py-2 text-sm font-semibold transition-colors duration-200 text-center ${activeTab === tabName ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`;
        
        const handleActionWithRefresh = async (endpoint: string, body?: object) => {
            const success = await onAction(endpoint, body);
            if (success) {
                await fetchData();
            }
        };

        const showConfirmationWithRefresh = (title: string, message: string, endpoint: string) => {
            showConfirmation(title, message, () => handleActionWithRefresh(endpoint));
        };

        return (
            <div className="flex flex-col h-full space-y-4">
                <div>
                    <h3 className="text-2xl font-bold text-cyan-300 text-center">{guildDetails.name}</h3>
                    <p className="text-center text-slate-400 text-sm">Cấp {guildDetails.level} | Tông Chủ: {guildDetails.leaderName}</p>
                </div>

                <div className="flex border-b border-slate-700 flex-shrink-0">
                    <button onClick={() => setActiveTab('info')} className={getTabClass('info')}>Thông Tin</button>
                    <button onClick={() => setActiveTab('members')} className={getTabClass('members')}>Thành Viên</button>
                    {canManageApps && <button onClick={() => setActiveTab('apps')} className={getTabClass('apps')}>Đơn Xin ({applications.length})</button>}
                    <button onClick={() => setActiveTab('ranking')} className={getTabClass('ranking')}>Cống Hiến</button>
                    <button onClick={() => setActiveTab('browse')} className={getTabClass('browse')}>Duyệt Tông Môn</button>
                </div>

                <div className="flex-grow overflow-y-auto scrollbar-main pr-2">
                    {activeTab === 'info' && <InfoTab player={player} guild={guildDetails} contributionAmount={contributionAmount} setContributionAmount={setContributionAmount} onContribute={() => handleActionWithRefresh('/guilds/contribute', { amount: parseInt(contributionAmount, 10)})} onLeave={() => showConfirmation(player.guild_role === 'leader' ? 'Xác Nhận Giải Tán' : 'Xác Nhận Rời Đi', player.guild_role === 'leader' ? "Bạn có chắc chắn muốn GIẢI TÁN Tông Môn? Hành động này không thể hoàn tác!" : "Bạn có chắc chắn muốn rời khỏi Tông Môn?", () => onAction('/guilds/leave'))} onActionWithRefresh={handleActionWithRefresh} />}
                    {activeTab === 'members' && <MembersTab members={guildDetails.members} onInspectPlayer={onInspectPlayer} currentPlayer={player} onActionWithRefresh={handleActionWithRefresh} showConfirmationWithRefresh={showConfirmationWithRefresh} gameData={gameData}/>}
                    {activeTab === 'apps' && canManageApps && <ApplicationsTab applications={applications} onActionWithRefresh={handleActionWithRefresh} gameData={gameData} />}
                    {activeTab === 'ranking' && <ContributionRankingTab members={guildDetails.members} />}
                    {activeTab === 'browse' && <BrowseGuildsTab guilds={allGuilds} />}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-cyan-300">Lập Tông Môn</h3>
                <div className="text-xs text-slate-400 mt-1">
                    <p>Yêu cầu để khai tông lập phái:</p>
                    <ul className="list-disc list-inside">
                        {creationCosts.map((cost: { type: string, amount: number }, index: number) => (
                            <li key={index}>
                                {resourceTypeToName[cost.type] || cost.type}: {formatNumber(cost.amount)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex space-x-2 mt-3">
                    <input type="text" value={newGuildName} onChange={(e) => setNewGuildName(e.target.value)} placeholder="Nhập tên Tông Môn" className="flex-grow bg-slate-800 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-cyan-500" />
                    <button onClick={handleCreate} disabled={!canCreateGuild || !newGuildName.trim()} className="px-4 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-600">Tạo</button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3 scrollbar-main">
                <h3 className="text-lg font-semibold text-cyan-300">Danh Sách Tông Môn</h3>
                {guilds.map(guild => {
                    const maxMembers = getGuildMemberLimit(guild.level);
                    const isFull = guild.memberCount >= maxMembers;
                    const isApplying = applyingTo === guild.id;
                    return (
                        <div key={guild.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <div>
                                <h4 className="font-bold text-md text-emerald-400">{guild.name} (Cấp {guild.level})</h4>
                                <p className="text-xs text-slate-500">Tông Chủ: {guild.leaderName} | Nhân số: {guild.memberCount}/{maxMembers}</p>
                                {guild.announcement && <p className="text-xs text-slate-400 mt-1 italic">Thông báo: {guild.announcement}</p>}
                            </div>
                            <button onClick={() => handleApply(guild.id)} disabled={isFull || guild.hasApplied || isApplying} className={`px-3 py-1 text-sm font-bold rounded-lg text-white ${isFull ? 'bg-slate-600' : (guild.hasApplied || isApplying) ? 'bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                {isApplying ? 'Đang Xin...' : isFull ? 'Đã Đầy' : guild.hasApplied ? 'Đang Chờ' : 'Xin Gia Nhập'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Sub-components for Guild Member View ---

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ initialText, onClose, onSave }) => {
    const [text, setText] = useState(initialText);

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg m-4 p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-cyan-300 mb-4">Chỉnh Sửa Thông Báo</h2>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={1000}
                    rows={5}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white scrollbar-modal"
                    placeholder="Nhập thông báo Tông Môn..."
                />
                <div className="flex justify-end space-x-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold rounded-lg bg-slate-600 hover:bg-slate-500 text-white">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Lưu</button>
                </div>
            </div>
        </div>
    );
};


const InfoTab: React.FC<InfoTabProps> = ({ player, guild, contributionAmount, setContributionAmount, onContribute, onLeave, onActionWithRefresh }) => {
    const expNeeded = getGuildNextLevelExp(guild.level);
    const progressPercent = (Number(guild.exp) / expNeeded) * 100;
    const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
    
    const handleSaveAnnouncement = (text: string) => {
        onActionWithRefresh('/guilds/set-announcement', { announcement: text });
    };

    return (
        <div className="space-y-4">
             {isEditingAnnouncement && (
                <AnnouncementModal
                    initialText={guild.announcement || ''}
                    onClose={() => setIsEditingAnnouncement(false)}
                    onSave={handleSaveAnnouncement}
                />
            )}
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-emerald-400">Thông Báo Tông Môn</h4>
                    {player.guild_role === 'leader' && (
                        <button onClick={() => setIsEditingAnnouncement(true)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Sửa</button>
                    )}
                </div>
                <p className="text-sm text-slate-300 italic whitespace-pre-wrap">{guild.announcement || 'Tông Môn chưa có thông báo nào.'}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                 <h4 className="text-md font-semibold text-emerald-400 mb-2">Phát Triển Tông Môn</h4>
                  <div>
                    <div className="flex justify-between items-baseline mb-1 text-xs">
                      <span className="text-slate-400">Kinh nghiệm:</span>
                      <span className="font-mono text-white">{formatNumber(Number(guild.exp))} / {formatNumber(expNeeded)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                     <input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md py-1 px-2 text-white text-sm" />
                     <button onClick={onContribute} disabled={player.qi < Number(contributionAmount) || Number(contributionAmount) <= 0} className="px-4 py-1 font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:bg-slate-600 text-sm">Cống Hiến</button>
                  </div>
            </div>
            <button onClick={onLeave} className="w-full px-4 py-2 text-sm font-bold rounded-lg bg-red-800 hover:bg-red-700 text-red-100">
                {player.guild_role === 'leader' ? 'Giải Tán Tông Môn' : 'Rời Khỏi Tông Môn'}
            </button>
        </div>
    );
};

const MembersTab: React.FC<MembersTabProps> = ({ members, onInspectPlayer, currentPlayer, onActionWithRefresh, showConfirmationWithRefresh, gameData }) => {
    const myHierarchy = ROLE_HIERARCHY[currentPlayer.guild_role!];
    return (
         <div className="space-y-2">
            {members.sort((a,b) => ROLE_HIERARCHY[b.guild_role] - ROLE_HIERARCHY[a.guild_role]).map((member) => {
                const targetHierarchy = ROLE_HIERARCHY[member.guild_role];
                const canManage = myHierarchy > targetHierarchy;
                const avatar = gameData.AVATARS.find(a => a.id === member.equipped_avatar_id);
                const avatarUrl = avatar?.url;

                return (
                    <div key={member.name} className="bg-slate-800/60 p-2 rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => onInspectPlayer(member.name)} className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden border-2 border-slate-600 hover:border-cyan-400 transition-colors">
                                {avatarUrl ? <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onInspectPlayer(member.name)} className="font-semibold text-white hover:text-cyan-300">{member.name}</button>
                                    {member.is_banned ? <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">BAN</span> : null}
                                </div>
                                <p className="text-xs text-yellow-400">{ROLES[member.guild_role]}</p>
                                <p className="text-xs text-slate-400">{gameData.REALMS[member.realmIndex]?.name}</p>
                            </div>
                        </div>
                        {canManage && currentPlayer.name !== member.name &&
                            <div className="flex flex-col space-y-1">
                                {myHierarchy > targetHierarchy + 1 && <button onClick={() => onActionWithRefresh(`/guilds/manage/promote/${member.name}`)} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Thăng</button>}
                                {targetHierarchy > 1 && <button onClick={() => onActionWithRefresh(`/guilds/manage/demote/${member.name}`)} className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">Giáng</button>}
                                <button onClick={() => showConfirmationWithRefresh('Xác nhận Trục Xuất', `Bạn có chắc muốn trục xuất ${member.name}?`, `/guilds/manage/kick/${member.name}`)} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">Trục</button>
                            </div>
                        }
                    </div>
                );
            })}
         </div>
    );
};

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ applications, onActionWithRefresh, gameData }) => {
    if (applications.length === 0) return <p className="text-center text-slate-500 pt-8">Không có đơn xin gia nhập nào.</p>;
    return (
        <div className="space-y-2">
            {applications.map(app => (
                <div key={app.id} className="bg-slate-800/60 p-2 rounded flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-white">{app.player_name}</p>
                        <p className="text-xs text-slate-400">{gameData.REALMS[app.realmIndex]?.name}</p>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => onActionWithRefresh('/guilds/applications/accept', { applicantName: app.player_name })} className="text-sm bg-green-600 text-white px-3 py-1 rounded">Duyệt</button>
                        <button onClick={() => onActionWithRefresh('/guilds/applications/reject', { applicantName: app.player_name })} className="text-sm bg-red-600 text-white px-3 py-1 rounded">Từ Chối</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ContributionRankingTab: React.FC<ContributionRankingTabProps> = ({ members }) => {
    const sortedMembers = useMemo(() => 
        [...members].sort((a, b) => Number(b.guild_contribution) - Number(a.guild_contribution)), 
    [members]);
    
    return (
        <div className="space-y-2">
            {sortedMembers.map((member, index) => (
                 <div key={member.name} className="bg-slate-800/60 p-2 rounded flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-bold w-8 text-center">{index + 1}</span>
                        <div>
                            <p className="font-semibold text-white">{member.name}</p>
                            <p className="text-xs text-slate-400">{ROLES[member.guild_role]}</p>
                        </div>
                    </div>
                    <span className="font-bold text-amber-400">{formatNumber(Number(member.guild_contribution))}</span>
                 </div>
            ))}
        </div>
    )
};

const BrowseGuildsTab: React.FC<{ guilds: Guild[] }> = ({ guilds }) => {
    if (guilds.length === 0) return <p className="text-center text-slate-500 pt-8">Không có Tông Môn nào khác.</p>;
    return (
        <div className="space-y-3">
            {guilds.map(guild => {
                const maxMembers = getGuildMemberLimit(guild.level);
                return (
                    <div key={guild.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <h4 className="font-bold text-md text-emerald-400">{guild.name} (Cấp {guild.level})</h4>
                        <p className="text-xs text-slate-500">Tông Chủ: {guild.leaderName} | Nhân số: {guild.memberCount}/{maxMembers}</p>
                        {guild.announcement && <p className="text-xs text-slate-400 mt-1 italic">Thông báo: {guild.announcement}</p>}
                    </div>
                );
            })}
        </div>
    );
};


export default GuildPanel;