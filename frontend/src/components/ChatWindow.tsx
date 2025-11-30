import type { FormEvent } from 'react';

import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../providers/WebsocketProvider';
import MessageItem from './MessageItem';
import './ChatWindow.css';

interface ChatWindowProps {
  userId: number;
}

// TODO: User id prop
function ChatWindow({ userId }: ChatWindowProps) {
  const { sendMessage, messages, isConnected } = useWebSocket();
  const [inputVal, setInputVal] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputVal.trim()) {
      const success = sendMessage(inputVal.trim());
      if (success) setInputVal('');
    }
  }

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages])

  return (
    <div className="window-container">
      <div className="message-container">
        {messages.map((msg, index) => (
          <MessageItem
            msg={msg}
            currUser={userId}
            key={`msg-item-${index}`}
          />
        ))}
        <div ref={messageEndRef} />
      </div> 
      <form 
        onSubmit={handleSubmit}
        className="input-container"
      >
        <input
          type="text" 
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Type a message..." 
          disabled={!isConnected}
          className="chat-input"
        />
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
