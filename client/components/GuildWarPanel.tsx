import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import GameData type and remove REALMS import from constants.
import type { Player, GuildWarState, GuildMember, GuildWarFightResult, GameData } from '../types';
import CombatReplayModal from './CombatReplayModal'; // UPDATED: Use the detailed PvP replay modal instead.
import { API_BASE_URL } from '../config/config';

const CountdownTimer = ({ toDate }: { toDate: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            const dest = new Date(toDate).getTime();
            const now = new Date().getTime();
            const diff = dest - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                clearInterval(intervalId);
                return;
            }

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [toDate]);

    return <span className="font-mono text-amber-400">{timeLeft}</span>;
};


interface GuildWarPanelProps {
    token: string | null;
    player: Player;
    gameData: GameData;
}

const GuildWarPanel: React.FC<GuildWarPanelProps> = ({ token, player, gameData }) => {
    const [state, setState] = useState<GuildWarState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchState = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/guild-war/state`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải dữ liệu Tông Môn Chiến.');
            const data = await response.json();
            setState(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchState();
        const interval = setInterval(fetchState, 10000); // Poll for updates
        return () => clearInterval(interval);
    }, [fetchState]);
    
    const handleRegister = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/guild-war/register`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            alert("Đăng ký thành công!");
            fetchState();
        } catch(err) {
            alert("Lỗi: " + (err as Error).message);
        }
    }

    if (isLoading) return <p className="text-center">Đang tải thông tin chiến trường...</p>;
    if (error) return <p className="text-center text-red-400">{error}</p>;
    if (!state?.current_war) return <p className="text-center text-slate-400">Hiện tại trời yên biển lặng, chưa có đại chiến nào diễn ra.</p>;
    
    const { current_war, is_registered, my_match, is_leader } = state;
    
    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-amber-300 text-center">{current_war.name}</h3>
            
            {current_war.status === 'REGISTRATION' && (
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center space-y-3">
                    <h4 className="text-lg font-semibold text-cyan-300">Giai Đoạn Ghi Danh</h4>
                    <p>Thời gian ghi danh còn lại: <CountdownTimer toDate={new Date(new Date(current_war.start_time).getTime() + 3600 * 1000).toISOString()} /></p>
                    {is_registered ? (
                        <p className="text-green-400 font-bold">Tông môn của bạn đã ghi danh!</p>
                    ) : (
                        is_leader ? (
                             <button onClick={handleRegister} className="px-6 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                                Ghi Danh
                            </button>
                        ) : (
                             <p className="text-slate-400">Chờ Tông Chủ ghi danh tham chiến.</p>
                        )
                    )}
                </div>
            )}
            
            {current_war.status === 'IN_PROGRESS' && (
                <>
                    {!my_match && <p className="text-center text-slate-400">Tông môn của bạn không tham gia trận chiến lần này, hoặc đang chờ ghép cặp.</p>}
                    {my_match && <MatchView match={my_match} token={token} player={player} onAction={fetchState} fightResults={state.fight_results || []} isLeader={is_leader} gameData={gameData} />}
                </>
            )}

            {current_war.status === 'COMPLETED' && <p className="text-center text-green-400">Sự kiện đã kết thúc.</p>}
        </div>
    );
};

const BattlefieldResultsView = ({ roundNumber, fights, guild1Name, guild2Name }: { roundNumber: number, fights: GuildWarFightResult[], guild1Name: string, guild2Name: string }) => {
    const [selectedFight, setSelectedFight] = useState<GuildWarFightResult | null>(null);

    return (
         <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            {selectedFight && <CombatReplayModal 
                log={selectedFight.combat_log || []} 
                player1Name={selectedFight.guild1_player}
                player2Name={selectedFight.guild2_player}
                onClose={() => setSelectedFight(null)} 
            />}
            <h4 className="text-lg font-semibold text-emerald-400 mb-2">Kết Quả Vòng {roundNumber}</h4>
            <div className="space-y-3">
                 <div className="grid grid-cols-5 items-center text-center gap-2 p-2 text-xs text-slate-400 uppercase">
                    <span>{guild1Name}</span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span>{guild2Name}</span>
                 </div>
                {fights.map(fight => (
                    <div key={fight.id} className="grid grid-cols-5 items-center text-center gap-2 p-2 bg-slate-800/50 rounded-md">
                        <span className={`font-semibold ${fight.winner_player === fight.guild1_player ? 'text-green-400' : 'text-slate-400'}`}>
                           {fight.winner_player === fight.guild1_player && '👑 '} {fight.guild1_player}
                        </span>
                        <span className="text-sm">vs</span>
                        <button onClick={() => setSelectedFight(fight)} className="text-cyan-400 text-sm font-bold bg-slate-700 rounded-md py-1 hover:bg-slate-600">
                            XEM LẠI
                        </button>
                        <span className="text-sm">vs</span>
                         <span className={`font-semibold ${fight.winner_player === fight.guild2_player ? 'text-green-400' : 'text-slate-400'}`}>
                           {fight.guild2_player} {fight.winner_player === fight.guild2_player && ' 👑'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}


const MatchView = ({ match, token, player, onAction, fightResults, isLeader, gameData }: { match: GuildWarState['my_match'], token: string | null, player: Player, onAction: () => void, fightResults: GuildWarFightResult[], isLeader: boolean, gameData: GameData }) => {
    if (!match) return null;
    const isGuild1 = player.guildId === match.guild1_id;
    const myScore = isGuild1 ? match.guild1_round_wins : match.guild2_round_wins;
    const opponentScore = isGuild1 ? match.guild2_round_wins : match.guild1_round_wins;
    
    const guild1Name = isGuild1 ? player.guildName : match.opponent.name;
    const guild2Name = isGuild1 ? match.opponent.name : player.guildName;

    const previousRoundFights = fightResults.filter(r => r.round_number === match.current_round - 1);

    return (
        <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center">
                 <h4 className="text-xl font-semibold text-cyan-300">Vòng {match.current_round} / 3</h4>
                <div className="flex justify-around items-center text-2xl font-bold mt-2">
                    <span className="text-white flex-1">{player.guildName}</span>
                    <span className="text-red-400 text-4xl mx-4">{myScore} - {opponentScore}</span>
                    <span className="text-white flex-1">{match.opponent.name}</span>
                </div>
            </div>
            
            {previousRoundFights.length > 0 &&
                <BattlefieldResultsView roundNumber={match.current_round - 1} fights={previousRoundFights} guild1Name={guild1Name!} guild2Name={guild2Name!} />
            }

            {match.status === 'PENDING_LINEUP' && (
                 <LineupSelectionView matchId={match.id} token={token} onLineupSubmitted={onAction} myLineupSubmitted={match.my_lineup_submitted} opponentLineupSubmitted={match.opponent_lineup_submitted} isLeader={isLeader} gameData={gameData} />
            )}
             {match.status === 'COMPLETED' && (
                <div className="text-center text-2xl font-bold p-4">
                    {match.winner_guild_id === player.guildId ? <p className="text-green-400">TÔNG MÔN TOÀN THẮNG!</p> : <p className="text-red-400">Thất Bại Đáng Tiếc!</p>}
                </div>
            )}
        </div>
    );
};

interface MemberStatus extends GuildMember {
    has_participated: boolean;
}

const LineupSelectionView = ({ matchId, token, onLineupSubmitted, myLineupSubmitted, opponentLineupSubmitted, isLeader, gameData }: {matchId: number; token: string | null; onLineupSubmitted: () => void; myLineupSubmitted: boolean; opponentLineupSubmitted: boolean; isLeader: boolean; gameData: GameData;}) => {
    const [eligibleMembers, setEligibleMembers] = useState<MemberStatus[]>([]);
    const [lineup, setLineup] = useState<{ vanguard: string | null, mid: string | null, commander: string | null }>({ vanguard: null, mid: null, commander: null });
    const [selectingFor, setSelectingFor] = useState<'vanguard' | 'mid' | 'commander' | null>(null);

    const positions: Record<'vanguard' | 'mid' | 'commander', string> = { vanguard: 'Tiên Phong', mid: 'Trung Quân', commander: 'Chủ Soái' };
    
    useEffect(() => {
        const fetchMembers = async () => {
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/guild-war/match/${matchId}/eligible-members`, { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) {
                setEligibleMembers(await res.json());
            }
        };
        fetchMembers();
    }, [matchId, token]);

    const handleSelectMember = (memberName: string) => {
        if (!selectingFor) return;
        
        // Deselect if this member is already in another slot
        const newLineup: any = { ...lineup };
        Object.keys(newLineup).forEach(pos => {
            if (newLineup[pos] === memberName) {
                newLineup[pos] = null;
            }
        });

        setLineup({ ...newLineup, [selectingFor]: memberName });
        setSelectingFor(null);
    };

    const isMemberSelected = (memberName: string) => Object.values(lineup).includes(memberName);

    const handleSubmitLineup = async () => {
        const fighters = [lineup.vanguard, lineup.mid, lineup.commander];
        if (fighters.some(f => f === null)) {
            alert("Vui lòng chọn đủ 3 vị trí.");
            return;
        }
         try {
            const res = await fetch(`${API_BASE_URL}/guild-war/match/${matchId}/lineup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fighters })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            alert("Thiết lập đội hình thành công!");
            onLineupSubmitted();
        } catch(err) {
            alert("Lỗi: " + (err as Error).message);
        }
    }
    
    if (!isLeader) {
         return <div className="text-center p-4 bg-slate-900/50 rounded-lg">Chờ Tông Chủ thiết lập đội hình...</div>
    }

    if(myLineupSubmitted) {
        return <div className="text-center p-4 bg-slate-900/50 rounded-lg text-green-400">Đã thiết lập đội hình. Chờ đối phương... ({opponentLineupSubmitted ? "Đối phương đã sẵn sàng" : "Đối phương chưa sẵn sàng"})</div>
    }

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
             <h4 className="text-lg font-semibold text-emerald-400">Sắp Xếp Đội Hình (Thành viên đã tham chiến không thể chọn lại)</h4>
             
             {/* Lineup Slots */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {(Object.keys(positions) as Array<keyof typeof positions>).map((pos) => (
                     <div key={pos} className="bg-slate-800 p-3 rounded-lg border-2 border-slate-600">
                         <h5 className="text-center font-bold text-cyan-400">{positions[pos]}</h5>
                         <div className="mt-2 h-16">
                            {lineup[pos] ? (
                                <div className="bg-slate-700 p-2 rounded text-center">
                                    <p className="font-semibold">{lineup[pos]}</p>
                                    <button onClick={() => setLineup(prev => ({...prev, [pos]: null}))} className="text-xs text-red-400 hover:underline">Xóa</button>
                                </div>
                            ) : (
                                <button onClick={() => setSelectingFor(pos)} className="w-full h-full border-2 border-dashed border-slate-500 rounded-lg text-slate-500 hover:bg-slate-700/50 hover:text-white">
                                    + Chọn
                                </button>
                            )}
                         </div>
                     </div>
                 ))}
             </div>

             {/* Member List Modal */}
             {selectingFor && (
                 <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4" onClick={() => setSelectingFor(null)}>
                     <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                         <h3 className="text-xl p-4 text-cyan-300 border-b border-slate-600">Chọn thành viên cho vị trí {positions[selectingFor]}</h3>
                         <div className="overflow-y-auto p-4 grid grid-cols-2 gap-2 scrollbar-modal">
                             {eligibleMembers.map(member => {
                                const isSelected = isMemberSelected(member.name);
                                return (
                                    <button
                                        key={member.name}
                                        onClick={() => handleSelectMember(member.name)}
                                        disabled={member.has_participated || isSelected}
                                        className="p-2 rounded border-2 text-left transition-colors bg-slate-900 border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-cyan-400"
                                    >
                                        <p className="font-semibold">{member.name}</p>
                                        <p className="text-xs text-slate-400">{gameData.REALMS[member.realmIndex]?.name || 'N/A'}</p>
                                        {isSelected && <p className="text-xs text-yellow-400">(Đã chọn)</p>}
                                    </button>
                                );
                             })}
                         </div>
                     </div>
                 </div>
             )}
             
             <div className="mt-4 text-center">
                <button onClick={handleSubmitLineup} disabled={Object.values(lineup).some(v => v === null)} className="px-6 py-2 font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white disabled:bg-slate-600 disabled:cursor-not-allowed">
                    Xác Nhận Đội Hình
                </button>
             </div>
        </div>
    )
}


export default GuildWarPanel;