import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, GameData, GenericItem } from '../types';
import { getRarityStyle } from '../constants';
import { API_BASE_URL } from '../config/config';

const CHAT_POLL_INTERVAL_MS = 3000;

interface ChatPanelProps {
  token: string | null;
  gameData: GameData;
  onInspectItem: (itemType: string, itemId: string, ownerName?: string) => void;
  onInspectPlayer: (playerName: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ token, gameData, onInspectItem, onInspectPlayer }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const lastMessageId = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalIdRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the chat input

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop <= clientHeight + 10;
    setIsAtBottom(atBottom);
  };

  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!token) return;
    if (!isInitial) setIsLoading(false); // không show loader cho poll ngầm

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/messages?since=${lastMessageId.current}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Không thể tải tin nhắn.');

      const newMessages: ChatMessage[] = await response.json();

      if (newMessages.length > 0) {
        lastMessageId.current = newMessages[newMessages.length - 1].id;

        if (isInitial) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...prev, ...newMessages]);
        }
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || isSending) return;

    const messageToSend = newMessage.trim();
    // Clear input immediately for a snappier feel
    setNewMessage('');

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Gửi tin nhắn thất bại.');
      }

      fetchMessages(); // fetch new messages immediately
    } catch (err) {
      setError((err as Error).message);
      // If sending fails, restore the message so the user can retry
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const { message } = msg;
    const regex = /\[ITEM:(\w+):([\w_]+):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message)) !== null) {
        if (match.index > lastIndex) {
            parts.push(message.substring(lastIndex, match.index));
        }

        const [_fullMatch, itemType, itemId, itemName] = match;
        
        let itemData: GenericItem | null = null;
        if (itemType === 'equipment') itemData = gameData.EQUIPMENT.find(i => i.id === itemId) as GenericItem;
        else if (itemType === 'pill') itemData = gameData.PILLS.find(i => i.id === itemId) as GenericItem;
        else if (itemType === 'herb') itemData = gameData.HERBS.find(i => i.id === itemId) as GenericItem;

        const rarity = (itemData as any)?.rarity;
        const { style, className } = getRarityStyle(rarity, gameData.RARITIES);

        parts.push(
            <button
                key={match.index}
                onClick={() => onInspectItem(itemType, itemId, msg.playerName)}
                className={`font-bold hover:underline p-0 m-0 bg-transparent border-none inline-flex items-center gap-1 ${className}`}
                style={{ ...style, display: 'inline-flex' }}
            >
                {itemData?.icon_url && <img src={itemData.icon_url} alt={itemName} className="w-4 h-4 inline-block" />}
                [{itemName}]
            </button>
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < message.length) {
        parts.push(message.substring(lastIndex));
    }

    return parts;
};

  useEffect(() => {
    fetchMessages(true); // load lần đầu

    const startPolling = () => {
      stopPolling();
      pollIntervalIdRef.current = window.setInterval(fetchMessages, CHAT_POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollIntervalIdRef.current) clearInterval(pollIntervalIdRef.current);
    };

    startPolling();
    return stopPolling;
  }, [fetchMessages]);

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom]);
  
  // Auto-focus the input when the panel becomes active
  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Re-focus the input after a message is sent.
    // This is more reliable than calling focus() in the async function's finally block,
    // as it runs after the re-render caused by setIsSending(false).
    if (!isSending) {
        // Using a small timeout can help in some browsers where focus is finicky
        setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isSending]);


  if (isLoading) {
    return <div className="text-center text-slate-400 p-4">Đang tải cuộc trò chuyện...</div>;
  }

  return (
    <div className="flex flex-col h-full relative min-h-0">
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-grow p-4 scrollbar-chat"
      >
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li key={msg.id} className="text-sm break-words flex items-start">
              <button onClick={() => onInspectPlayer(msg.playerName)} className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 mr-2 mt-0.5 overflow-hidden border-2 border-slate-600 hover:border-cyan-400 transition-colors">
                {msg.avatarUrl ? <img src={msg.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
              </button>
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-cyan-400 text-xs">{msg.playerName}</p>
                <p className="text-slate-300">{renderMessageContent(msg)}</p>
              </div>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
        {error && <p className="text-xs text-red-400 text-center mt-2">{error}</p>}
      </div>

      {!isAtBottom && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-20 right-4 px-3 py-1 bg-slate-700/80 rounded-full text-xs text-white shadow-lg backdrop-blur-sm"
        >
          Xuống cuối ⬇
        </button>
      )}

      <form onSubmit={handleSendMessage} className="flex-shrink-0 flex space-x-2 p-4 border-t border-slate-700">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Luận đạo tại đây..."
          maxLength={200}
          className="flex-grow bg-slate-900 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !newMessage.trim()}
          className="px-4 py-2 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-400/50 disabled:bg-slate-600 disabled:opacity-50"
        >
          {isSending ? '...' : 'Gửi'}
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;