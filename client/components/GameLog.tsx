

import React from 'react';
import type { GameEvent } from '../types';

interface GameLogProps {
  events: GameEvent[];
}

const eventTypeClasses = {
  info: 'text-slate-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
};

const GameLog: React.FC<GameLogProps> = ({ events }) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold text-cyan-300 border-b-2 border-slate-700 pb-2 mb-2 flex-shrink-0">Nhật Ký Tu Luyện</h2>
      <div className="overflow-y-auto flex-grow pr-2 scrollbar-chat">
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className={`text-sm ${eventTypeClasses[event.type]}`}>
              <span className="font-mono text-xs mr-2 opacity-50">{new Date(event.timestamp).toLocaleTimeString()}</span>
              {event.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameLog;