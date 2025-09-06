import { FC, useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import { API_BASE_URL } from '../../config/config';

interface GuildWarManagerProps {
    token: string;
}
const GuildWarManager: FC<GuildWarManagerProps> = ({ token }) => {
    const [warState, setWarState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const fetchWarState = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/guild_war_details`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể tải dữ liệu Tông Môn Chiến.');
            setWarState(await res.json());
        } catch (err) {
            alert('Lỗi: ' + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchWarState() }, [fetchWarState]);

    const handleForceProcess = async (matchId: number) => {
        if (!confirm(`Bạn có chắc muốn ép xử lý vòng đấu cho trận ${matchId}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/guild_war/force_process/${matchId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
            fetchWarState();
        } catch (err) {
            alert('Lỗi: ' + (err as Error).message);
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (!warState || !warState.active_war) return (
        <div className="bg-slate-800/50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-cyan-300">Quản Lý Tông Môn Chiến</h2>
            <p className="mt-4">Không có Tông Môn Chiến nào đang hoạt động.</p>
        </div>
    );

    const { active_war, matches } = warState;

    const renderLineup = (lineup: any) => {
        if (!lineup) return <span className="text-yellow-400">Chưa xếp</span>;
        return (
            <ol className="list-decimal list-inside text-xs">
                <li>{lineup.player1_name}</li>
                <li>{lineup.player2_name}</li>
                <li>{lineup.player3_name}</li>
            </ol>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h2 className="text-2xl font-bold text-cyan-300">Cuộc Chiến Hiện Tại: {active_war.name}</h2>
                <p>Trạng thái: <span className="font-semibold text-amber-300">{active_war.status}</span></p>
                <p>Bắt đầu: {new Date(active_war.start_time).toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-cyan-300 mb-4">Các Trận Đấu</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Tông Môn 1</th>
                                <th className="px-4 py-2">Tông Môn 2</th>
                                <th className="px-4 py-2">Tỉ Số</th>
                                <th className="px-4 py-2">Vòng</th>
                                <th className="px-4 py-2">Trạng Thái</th>
                                <th className="px-4 py-2">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map((match: any) => (
                                <tr key={match.id} className="border-b border-slate-700 hover:bg-slate-800">
                                    <td className="px-4 py-2">{match.id}</td>
                                    <td className="px-4 py-2">{match.guild1_name}</td>
                                    <td className="px-4 py-2">{match.guild2_name}</td>
                                    <td className="px-4 py-2 font-bold">{match.guild1_round_wins} - {match.guild2_round_wins}</td>
                                    <td className="px-4 py-2">{match.current_round}</td>
                                    <td className="px-4 py-2">{match.status}</td>
                                    <td className="px-4 py-2 space-x-2">
                                        <button onClick={() => setSelectedMatch(match)} className="font-medium text-blue-400 hover:underline">Chi Tiết</button>
                                        {match.status === 'PENDING_LINEUP' && (
                                            <button onClick={() => handleForceProcess(match.id)} className="font-medium text-red-400 hover:underline">Ép Xử Lý</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedMatch && (
                <Modal title={`Chi Tiết Trận Đấu #${selectedMatch.id}`} onClose={() => setSelectedMatch(null)}>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-xl text-white">{selectedMatch.guild1_name}</h4>
                            <p className="text-sm text-slate-400">Đội hình vòng {selectedMatch.current_round}:</p>
                            <div className="mt-2 p-2 bg-slate-700/50 rounded">{renderLineup(selectedMatch.guild1_lineup)}</div>
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-white">{selectedMatch.guild2_name}</h4>
                            <p className="text-sm text-slate-400">Đội hình vòng {selectedMatch.current_round}:</p>
                            <div className="mt-2 p-2 bg-slate-700/50 rounded">{renderLineup(selectedMatch.guild2_lineup)}</div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default GuildWarManager;