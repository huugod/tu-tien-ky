import React, { useState, useEffect, useRef } from 'react';
import type { CombatLogEntry } from '../types';
import { formatNumber } from '../constants';

interface CombatReplayModalProps {
  log: CombatLogEntry[];
  player1Name: string;
  player2Name: string;
  onClose: () => void;
}

const CombatBar: React.FC<{ label: string, value: number, max: number, barClass: string }> = ({ label, value, max, barClass }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span className="font-bold">{label}</span>
            <span>{formatNumber(value)} / {formatNumber(max)}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
            <div className={`${barClass} h-full rounded-full transition-all duration-300 ease-in-out`} style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}></div>
        </div>
    </div>
);

const CombatReplayModal: React.FC<CombatReplayModalProps> = ({ log, player1Name, player2Name, onClose }) => {
    const [currentTurn, setCurrentTurn] = useState(0);
    const [displayedLog, setDisplayedLog] = useState<CombatLogEntry[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    const currentState = displayedLog[displayedLog.length - 1]?.state || log[0]?.state;

    useEffect(() => {
        if (currentTurn < log.length) {
            const timer = setTimeout(() => {
                setDisplayedLog(prev => [...prev, log[currentTurn]]);
                setCurrentTurn(prev => prev + 1);
            }, 300); // Adjust speed of replay here
            return () => clearTimeout(timer);
        }
    }, [currentTurn, log]);

    useEffect(() => {
        logContainerRef.current?.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [displayedLog]);
    
    const getLogColor = (type: CombatLogEntry['type']): string => {
      switch(type) {
        case 'action': return 'text-slate-300';
        case 'info': return 'text-slate-400 italic';
        case 'skill': return 'text-amber-300 font-bold';
        default: return 'text-slate-300';
      }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 border-b border-slate-600 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-cyan-300">Chiến Báo</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>

                {currentState && (
                    <div className="flex-shrink-0 p-4 grid grid-cols-2 gap-4 border-b border-slate-700">
                        {/* Player 1 Stats */}
                        <div>
                             <h3 className="text-lg font-bold text-green-400 truncate">{player1Name}</h3>
                             <div className="space-y-1 mt-1">
                                <CombatBar label="HP" value={currentState[player1Name].hp} max={currentState[player1Name].maxHp} barClass="bg-red-500" />
                                <CombatBar label="Sát Khí" value={currentState[player1Name].energy} max={currentState[player1Name].maxEnergy} barClass="bg-purple-500" />
                             </div>
                        </div>
                        {/* Player 2 Stats */}
                         <div>
                             <h3 className="text-lg font-bold text-red-400 truncate text-right">{player2Name}</h3>
                              <div className="space-y-1 mt-1">
                                <CombatBar label="HP" value={currentState[player2Name].hp} max={currentState[player2Name].maxHp} barClass="bg-red-500" />
                                <CombatBar label="Sát Khí" value={currentState[player2Name].energy} max={currentState[player2Name].maxEnergy} barClass="bg-purple-500" />
                             </div>
                        </div>
                    </div>
                )}

                <div ref={logContainerRef} className="flex-grow p-4 overflow-y-auto scrollbar-modal">
                     <ul className="space-y-2 text-sm">
                        {displayedLog.map((entry, index) => (
                            <li key={index} className={`transition-opacity duration-300 ${getLogColor(entry.type)}`}>
                                <span className="font-mono text-xs mr-2 opacity-50">[{entry.turn}]</span>
                                {entry.text}
                            </li>
                        ))}
                    </ul>
                     {currentTurn >= log.length && (
                        <div className="text-center mt-4">
                            <button onClick={onClose} className="px-6 py-2 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Đóng</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CombatReplayModal;