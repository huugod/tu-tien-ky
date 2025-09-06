import React from 'react';
import type { ActiveEvent } from '../types';

interface EventsPanelProps {
    events: ActiveEvent[];
}

const formatBonus = (type: string, value: number): string => {
    const formatPercent = (val: number) => {
        const percentValue = (val - 1) * 100;
        const sign = percentValue >= 0 ? '+' : '';
        return `${sign}${parseFloat(percentValue.toFixed(1))}%`;
    };
    const formatAddPercent = (val: number) => {
        const percentValue = val * 100;
        const sign = percentValue >= 0 ? '+' : '';
        return `${sign}${parseFloat(percentValue.toFixed(1))}%`;
    };
    const formatAddValue = (val: number) => {
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val}`;
    };

    switch(type) {
        // Cultivation
        case 'qi_multiplier':
        case 'qi_per_second_multiplier':
            return `Tốc độ tu luyện ${formatPercent(value)}`;
        case 'breakthrough_add':
        case 'breakthrough_chance_add':
            return `Tỷ lệ đột phá ${formatAddPercent(value)}`;

        // Crafting & Gathering
        case 'alchemy_success_add':
            return `Tỷ lệ Luyện Đan ${formatAddPercent(value)}`;
        case 'body_temper_eff_add':
            return `Hiệu quả Luyện Thể ${formatAddPercent(value)}`;
        case 'exploration_yield_mul':
            return `Sản lượng Thám Hiểm ${formatPercent(value)}`;

        // Game Systems
        case 'pvp_honor_mul':
            return `Điểm Vinh Dự PvP ${formatPercent(value)}`;
        case 'pve_linh_thach_mul':
            return `Linh Thạch Thí Luyện ${formatPercent(value)}`;

        // Combat Stats
        case 'hp_mul':
            return `Sinh Lực ${formatPercent(value)}`;
        case 'atk_mul':
            return `Công Kích ${formatPercent(value)}`;
        case 'def_mul':
            return `Phòng Ngự ${formatPercent(value)}`;
        case 'speed_mul':
            return `Tốc Độ ${formatPercent(value)}`;
        case 'hp_add':
            return `Sinh Lực ${formatAddValue(value)}`;
        case 'atk_add':
            return `Công Kích ${formatAddValue(value)}`;
        case 'def_add':
            return `Phòng Ngự ${formatAddValue(value)}`;
        case 'speed_add':
            return `Tốc Độ ${formatAddValue(value)}`;
        case 'crit_rate_add':
            return `Tỷ lệ Bạo Kích ${formatAddPercent(value)}`;
        case 'crit_damage_add':
            return `ST Bạo Kích ${formatAddPercent(value)}`;
        case 'dodge_rate_add':
            return `Tỷ lệ Né Tránh ${formatAddPercent(value)}`;
        case 'lifesteal_rate_add':
            return `Hút Máu ${formatAddPercent(value)}`;
        case 'counter_rate_add':
            return `Tỷ lệ Phản Đòn ${formatAddPercent(value)}`;
        case 'hit_rate_add':
            return `Chính Xác ${formatAddPercent(value)}`;
        case 'crit_resist_add':
            return `Kháng Bạo Kích ${formatAddPercent(value)}`;
        case 'lifesteal_resist_add':
            return `Kháng Hút Máu ${formatAddPercent(value)}`;
        case 'counter_resist_add':
            return `Kháng Phản Đòn ${formatAddPercent(value)}`;

        default:
            return `Phúc lợi đặc biệt: ${type}`;
    }
};


const EventsPanel: React.FC<EventsPanelProps> = ({ events }) => {
    return (
        <div className="flex-grow bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col min-h-0">
            <h3 className="text-md font-semibold text-emerald-400 mb-2 flex-shrink-0">Thiên Địa Sự Kiện</h3>
            <div className="overflow-y-auto pr-2 space-y-3 flex-grow">
                {events.length === 0 && (
                    <p className="text-sm text-slate-500 text-center pt-8">Hiện tại trời yên biển lặng, chưa có sự kiện nào diễn ra.</p>
                )}
                {events.map(event => (
                    <div key={event.id} className="bg-slate-800/60 p-3 rounded-lg">
                        <h4 className="font-bold text-cyan-400">{event.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 italic">{event.description}</p>
                        <div className="mt-2 space-y-1">
                            {(event.bonuses || []).map((bonus, index) => (
                                <p key={index} className="text-xs font-semibold text-amber-300">
                                   {formatBonus(bonus.type, bonus.value)}
                                </p>
                            ))}
                        </div>
                        <p className="text-right text-xs text-slate-500 mt-1">
                            Kết thúc: {new Date(event.expires_at).toLocaleString('vi-VN')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsPanel;