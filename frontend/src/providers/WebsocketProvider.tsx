import type { ReactNode } from 'react';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Types
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

// Create WebSocket Context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Custom hook to use WebSocket
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// WebSocket Provider Component
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // Build WebSocket URL
  const wsUrl = `${url}/ws/${roomId}?user_id=${userId}&username=${encodeURIComponent(username)}`;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        toast.info(`Connected to room ${roomId}!`)
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          
          switch (data.type) {
            case 'message':
              console.log('Recieved message:', data); // REMOVE
              setMessages((prev) => [...prev, data as ChatMessage]);
              break;
            case 'user_joined':
            case 'user_left':
              // Only display join/leave if not the current user
              if (userId !== data.user_id) {
                setMessages((prev) => [...prev, ({ ...data, isSystem: true } as SystemMessage)]);
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
        toast.error('Server connection error!')
      };

      ws.onclose = (event: CloseEvent) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          toast.error('Failed to connect to server after a few tries :(');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      toast.error('Failed to connect to server :(');
    }
  }, [wsUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

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

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [userId, username]);

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
