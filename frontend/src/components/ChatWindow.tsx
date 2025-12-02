/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: ChatWindow.tsx
 * Description:
 *    UI component responsible for displaying and sending messages
 *    within an active chat room. Integrates with the global WebSocket
 *    provider to:
 *      - Listen for new messages
 *      - Render formatted messages in real-time
 *      - Allow sending messages through an input form
 *
 * Inputs:
 *    - userId (number): The currently authenticated user's ID.
 *
 * Outputs:
 *    - Real-time UI updates as new messages are received or submitted.
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

import type { FormEvent } from 'react';
import { useState, useRef, useEffect } from 'react';

import { useWebSocket } from '../providers/WebsocketProvider';
import MessageItem from './MessageItem';

import './ChatWindow.css';

interface ChatWindowProps {
  userId: number;
}

function ChatWindow({ userId }: ChatWindowProps) {
  // Extract WebSocket state + message actions from global provider
  const { sendMessage, messages, isConnected } = useWebSocket();

  // Controlled input value for new messages
  const [inputVal, setInputVal] = useState("");

  // Reference to auto-scroll UI to most recent message
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * Handle sending a new chat message
   * - Prevent page refresh from <form> default behavior
   * - Reject empty or whitespace-only messages
   * - Trigger WebSocket send via provider
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (inputVal.trim()) {
      const success = sendMessage(inputVal.trim());

      // If WebSocket successfully sent => clear input
      if (success) setInputVal('');
    }
  };

  /**
   * Whenever message list updates, scroll to bottom of chat
   * Smooth scrolling improves UX for long chat sessions
   */
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Runs every time a new message is added

  return (
    <div className="window-container">
      
      {/* Scrollable list of chat messages */}
      <div className="message-container">
        {messages.map((msg, index) => (
          <MessageItem
            msg={msg}            // Content + metadata for chat bubble
            currUser={userId}    // Used to style user's own messages
            key={`msg-item-${index}`}
          />
        ))}
        {/* Invisible bottom anchor used for smooth auto-scroll */}
        <div ref={messageEndRef} />
      </div>

      {/* Input area for sending new messages */}
      <form 
        onSubmit={handleSubmit}
        className="input-container"
      >
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}  // Prevent input when WS is not connected
          className="chat-input"
        />

        {/* Disabled if no WebSocket OR empty message */}
        <button 
          type="submit"
          className="send-button"
          disabled={!isConnected || !inputVal.trim()}
        >
          Send
        </button>
      </form>

    </div>
  );
}

export default ChatWindow;

