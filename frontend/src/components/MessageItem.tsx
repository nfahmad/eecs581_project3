import type { WebSocketMessage } from '../providers/WebsocketProvider';
import './MessageItem.css';

interface MessageItemProps {
  currUser: number;
  msg: WebSocketMessage;
};

function formatMessageTimestamp(date: string) {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Check if the message is from today
  const isToday = messageDate.getDate() === now.getDate() &&
                  messageDate.getMonth() === now.getMonth() &&
                  messageDate.getFullYear() === now.getFullYear();
  
  if (isToday) {
    // Return just the time for today's messages
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    // Return date + time for older messages
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }) + ' at ' + messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

function MessageItem({ msg, currUser }: MessageItemProps) {

  const timeStamp = formatMessageTimestamp(msg.timestamp);

  switch (msg.type) {
    case "message":
      return (
        <div className={"message user " + (msg.user_id == currUser ? "current" : "")}>
          <span className="message-username">{msg.username}</span><span className="message-time">{timeStamp}</span>
          <br />
          {msg.content}
          <br />
        </div>
      );
    case "user_joined":
      return (
        <div className="message system-info" title={timeStamp}>
          {`${msg.username} just joined!`}
        </div>
      );
    case "user_left":
      return (
        <div className="message system-info">
          {`${msg.username} just left :(`}
        </div>
      );
    case "error":
      return (
        <div className="message system-error">
          Something went wrong!
          <br />
          {timeStamp}
        </div>
      );
    default:
      return <></>;
  }
}

export default MessageItem;
