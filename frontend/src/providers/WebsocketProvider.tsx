import type { ReactNode } from 'react';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Types (keep all your type definitions the same)
interface User {
  user_id: number;
  username: string;
}

interface BaseMessage {
  type: string;
  timestamp: string;
}

interface ChatMessage extends BaseMessage {
  type: 'message';
  id: number;
  content: string;
  user_id: number;
  username: string;
  room_id: number;
}

interface SystemMessage extends BaseMessage {
  type: 'user_joined' | 'user_left';
  user_id: number;
  username: string;
  message: string;
  isSystem?: boolean;
}

interface RoomUsersMessage extends BaseMessage {
  type: 'room_users';
  users: User[];
}

interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

export type WebSocketMessage = ChatMessage | SystemMessage | RoomUsersMessage | ErrorMessage;

interface WebSocketContextType {
  messages: WebSocketMessage[];
  isConnected: boolean;
  activeUsers: User[];
  sendMessage: (content: string) => boolean;
  clearMessages: () => void;
  connect: () => void;
  disconnect: () => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
  roomId: number;
  userId: number;
  username: string;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url, 
  roomId, 
  userId, 
  username 
}) => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const wsRef = useRef<WebSocket | null>(null);


  // Send message
  const sendMessage = useCallback((content: string): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      toast.error('Not connected to server');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        content,
        type: 'message'
      }));
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const connect = useCallback(() => {
    // Placeholder - actual connection happens in useEffect
  }, []);

  const disconnect = useCallback(() => {
    // Placeholder - actual disconnection happens in useEffect cleanup
  }, []);

  // Main WebSocket effect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let shouldReconnect = true; // Flag to control reconnection
    const maxReconnectAttempts = 5;

    const wsUrl = `${url}/ws/${roomId}?user_id=${userId}&username=${encodeURIComponent(username)}`;

    const connectWs = () => {
      if (!shouldReconnect) return;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!shouldReconnect) return;
          console.log('WebSocket connected');
          toast.success(`Connected to room ${roomId}!`);
          setIsConnected(true);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event: MessageEvent) => {
          if (!shouldReconnect) return;

          try {
            const data = JSON.parse(event.data) as WebSocketMessage;

            switch (data.type) {
              case 'message':
                console.log('Received message:', data);
                setMessages((prev) => [...prev, data as ChatMessage]);
                break;
              case 'user_joined':
              case 'user_left':
                if (userId !== data.user_id) {
                  setMessages((prev) => [...prev, { ...data, isSystem: true } as SystemMessage]);
                }
                break;
              case 'room_users':
                setActiveUsers((data as RoomUsersMessage).users);
                break;
              case 'error':
                toast.error((data as ErrorMessage).message);
                console.error('WebSocket error:', (data as ErrorMessage).message);
                break;
              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };

        ws.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          toast.error('Server connection error!');
        };

        ws.onclose = (event: CloseEvent) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);

          // Only reconnect if shouldReconnect is true and under max attempts
          if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);

            reconnectTimeout = setTimeout(() => {
              connectWs();
            }, delay);
          } else if (shouldReconnect) {
            toast.error('Failed to connect to server after a few tries :(');
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        toast.error('Failed to connect to server :(');
      }
    };

    const getMessages = async () => {
      console.log("Getting messages");
      try {
        const res = await fetch(`http://localhost:8000/ws/${roomId}/messages`);

        if (res.body) {
          const res_body = await res.json();

          if (res_body.detail) {
            toast.error(res_body.detail);
            return;
          }

          const messages = res_body.map(msg => JSON.parse(msg.content));
          setMessages(messages.filter(msg => msg.type === 'message'));
          return;
        }

        toast.error("Couldn't load previous messages...")
        setMessages([]);

      } catch (err) {
        console.log(err);
        toast.error("Something went wrong trying to load previous messages!")
        setMessages([]);
      }
    };

    getMessages();
    connectWs();

    // Cleanup
    return () => {
      shouldReconnect = false; // Disable reconnection immediately

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (ws) {
        ws.close();
      }

      wsRef.current = null;
      setIsConnected(false);
      // setMessages([]);
    };
  }, [url, roomId, userId, username]);

  const value: WebSocketContextType = {
    messages,
    isConnected,
    activeUsers,
    sendMessage,
    clearMessages,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

