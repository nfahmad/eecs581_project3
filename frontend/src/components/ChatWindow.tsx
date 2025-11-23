import type { FormEvent } from 'react';

import { useState } from 'react';
import { useWebSocket } from '../providers/WebsocketProvider';
import MessageItem from './MessageItem';
import './ChatWindow.css';

// TODO: User id prop
function ChatWindow() {
  const { sendMessage, messages, isConnected } = useWebSocket();
  const [inputVal, setInputVal] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputVal.trim()) {
      const success = sendMessage(inputVal.trim());
      if (success) setInputVal('');
    }
  }

  return (
    <div className="window-container">
      <div className="message-container">
        {messages.map((msg, index) => <MessageItem msg={msg} key={`msg-item-${index}`}/>)}
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
