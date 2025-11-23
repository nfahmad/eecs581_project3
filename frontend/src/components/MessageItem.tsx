import type { WebSocketMessage } from '../providers/WebsocketProvider';
import './MessageItem.css';

interface MessageItemProps {
  msg: WebSocketMessage
};

function MessageItem({ msg }: MessageItemProps) {

  const dateTime = new Date(msg.timestamp);
  const timeStamp = dateTime.toLocaleTimeString();

  switch (msg.type) {
    case "message":
      return (
        <div className={"message user " + (msg.user_id == 2 ? "current" : "")}>
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
