import React from 'react';
import EventsPanel from './EventsPanel';
import RedeemCodePanel from './RedeemCodePanel';
import type { ActiveEvent } from '../types';

interface SystemPanelProps {
    token: string | null;
    activeEvents: ActiveEvent[];
    onRedeemCode: (code: string) => Promise<boolean | void>;
}

const SystemPanel: React.FC<SystemPanelProps> = ({activeEvents, onRedeemCode }) => {
    return (
        <div className="flex flex-col space-y-4">
            <EventsPanel events={activeEvents} />
            <RedeemCodePanel onRedeemCode={onRedeemCode} />
        </div>
    );
};

export default SystemPanel;