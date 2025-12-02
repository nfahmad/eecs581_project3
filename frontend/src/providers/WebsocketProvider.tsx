/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: WebsocketProvider.tsx
 * Description:
 *    Provides a React Context wrapper around the browser WebSocket API
 *    for the entire application. It is responsible for:
 *      - Opening and managing a WebSocket connection to the backend.
 *      - Automatically reconnecting on disconnect (with backoff & cap).
 *      - Fetching previous chat messages for the current room on mount.
 *      - Exposing:
 *          • messages (chat + system)
 *          • isConnected flag
 *          • activeUsers in the room (if server sends this)
 *          • sendMessage() API for components
 *          • clearMessages(), connect(), disconnect() placeholders
 *
 * Inputs (props):
 *    - children: ReactNode
 *          Components that will consume the WebSocket context.
 *    - url: string
 *          Base URL of the backend server (without /ws/...).
 *    - roomId: number
 *          ID of the room to connect to via WebSocket.
 *    - userId: number
 *          ID of the current user; sent as query parameter when connecting.
 *    - username: string
 *          Username of the current user; also sent in query parameters.
 *
 * Outputs:
 *    - React Context that can be consumed via useWebSocket() hook.
 *    - Real-time UI updates driven by WebSocket messages.
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

import type { ReactNode } from 'react';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// =========================
// Type Definitions
// =========================

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
  isSystem?: boolean; // Flag used client-side to identify system messages
}

interface RoomUsersMessage extends BaseMessage {
  type: 'room_users';
  users: User[];
}

interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

// Union type for all possible WebSocket messages the client handles
export type WebSocketMessage = ChatMessage | SystemMessage | RoomUsersMessage | ErrorMessage;

// Shape of values exposed through the WebSocket context
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

// =========================
// Context + Hook
// =========================

const WebSocketContext = createContext<WebSocketContextType | null>(null);

/**
 * Custom hook for consuming the WebSocket context.
 * Ensures a helpful error is thrown if used outside of the provider.
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// =========================
// Provider Component
// =========================

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url, 
  roomId, 
  userId, 
  username 
}) => {
  // All messages currently in view (loaded history + live)
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Whether the WebSocket is currently open and ready
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Active users in the room (if server sends room_users)
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  // Mutable reference to the actual WebSocket instance
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * Send a chat message to the server over WebSocket.
   * Returns:
   *   - true  if the message was successfully queued for sending
   *   - false if the socket is not open or if there was an error.
   */
  const sendMessage = useCallback((content: string): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      toast.error('Not connected to server');
      return false;
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          content,
          type: 'message',
        })
      );
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  }, []);

  /**
   * Clear messages from local state.
   * Does NOT affect server-side history.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Optional manual connect API (currently a placeholder).
   * Actual connection is created automatically in useEffect.
   */
  const connect = useCallback(() => {
    // Placeholder - actual connection happens in useEffect
  }, []);

  /**
   * Optional manual disconnect API (currently a placeholder).
   * Actual disconnection happens in useEffect cleanup.
   */
  const disconnect = useCallback(() => {
    // Placeholder - actual disconnection happens in useEffect cleanup
  }, []);

  // =========================
  // Main WebSocket lifecycle effect
  // =========================

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let shouldReconnect = true;       // Controls whether reconnection is allowed
    const maxReconnectAttempts = 5;   // Safety cap on retries

    // Compose WebSocket URL with room + user identity info
    const wsUrl = `${url}/ws/${roomId}?user_id=${userId}&username=${encodeURIComponent(
      username
    )}`;

    /**
     * Helper function to encapsulate WebSocket creation and event wiring.
     * Supports exponential backoff reconnection on close events.
     */
    const connectWs = () => {
      if (!shouldReconnect) return;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Fired when the WebSocket handshake completes
        ws.onopen = () => {
          if (!shouldReconnect) return;
          console.log('WebSocket connected');
          toast.success(`Connected to room ${roomId}!`);
          setIsConnected(true);
          reconnectAttempts = 0; // Reset attempts on successful connection
        };

        // Fired on any message from the server
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
                // Only show system join/leave for other users
                if (userId !== (data as SystemMessage).user_id) {
                  setMessages((prev) => [
                    ...prev,
                    { ...(data as SystemMessage), isSystem: true } as SystemMessage,
                  ]);
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

        // Fired when the browser detects an error with the WS connection
        ws.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          toast.error('Server connection error!');
        };

        // Fired when the connection is closed (cleanly or not)
        ws.onclose = (event: CloseEvent) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);

          // Reconnect with exponential backoff if allowed and not exceeded attempts
          if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);

            reconnectTimeout = setTimeout(() => {
              connectWs();
            }, delay);
          } else if (shouldReconnect) {
            // Reached max attempts but still allowed to reconnect logically
            toast.error('Failed to connect to server after a few tries :(');
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        toast.error('Failed to connect to server :(');
      }
    };

    /**
     * Fetch previous messages for the current room from REST endpoint.
     * This runs once on mount/room change before live WebSocket events.
     */
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

          // Each message row from DB stores serialized JSON in content.
          // Parse each and keep only normal 'message' types for the UI.
          const messages = res_body.map((msg: { content: string }) =>
            JSON.parse(msg.content)
          );
          setMessages(messages.filter((msg: WebSocketMessage) => msg.type === 'message'));
          return;
        }

        toast.error("Couldn't load previous messages...");
        setMessages([]);
      } catch (err) {
        console.log(err);
        toast.error('Something went wrong trying to load previous messages!');
        setMessages([]);
      }
    };

    // Initial history load + live connection
    getMessages();
    connectWs();

    // Cleanup when component unmounts or when dependencies change
    return () => {
      // Prevent further reconnection attempts
      shouldReconnect = false;

      // Cancel any pending reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      // Gracefully close the current WebSocket connection
      if (ws) {
        ws.close();
      }

      wsRef.current = null;
      setIsConnected(false);
      // Optionally could clear messages here if desired:
      // setMessages([]);
    };
  }, [url, roomId, userId, username]);

  // Value exposed to all components inside the provider
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
