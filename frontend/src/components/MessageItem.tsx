/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: MessageItem.tsx
 * Description:
 *    Renders a single message in the chat interface. Supports different
 *    message types including:
 *      - Regular user chat messages
 *      - System notifications (user joined / user left)
 *      - Error notifications
 *
 *    Includes timestamp formatting and styling to highlight messages
 *    belonging to the currently logged-in user.
 *
 * Inputs (props):
 *    - currUser: ID of the current client user (used to highlight own messages)
 *    - msg: WebSocketMessage structured message payload received from server
 *
 * Outputs:
 *    - Styled JSX elements representing a single message bubble
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

import type { WebSocketMessage } from '../providers/WebsocketProvider';
import './MessageItem.css';

interface MessageItemProps {
  currUser: number;
  msg: WebSocketMessage;
};

/**
 * Format timestamp into:
 *  - Time only for messages posted today
 *  - Date + time for older messages
 *
 * Improves readability while keeping relevant temporal context.
 */
function formatMessageTimestamp(date: string) {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Determine if the message was sent on the current date
  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();
  
  if (isToday) {
    // Example: "3:17 PM"
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    // Example: "Nov 28 at 4:01 PM" — or includes year if different year
    return (
      messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }) +
      ' at ' +
      messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  }
}

function MessageItem({ msg, currUser }: MessageItemProps) {
  const timeStamp = formatMessageTimestamp(msg.timestamp);

  /**
   * Render different visual layouts based on message.type
   * - "message": Standard chat bubble structure
   * - "user_joined" or "user_left": System informational notifications
   * - "error": Indicates a broadcast or connection failure
   */
  switch (msg.type) {
    case "message":
      return (
        <div
          className={
            "message user " +
            (msg.user_id == currUser ? "current" : "") // Highlight own messages
          }
        >
          {/* Username + timestamp inline */}
          <span className="message-username">{msg.username}</span>
          <span className="message-time">{timeStamp}</span>
          <br />
          {/* Chat text body */}
          {msg.content}
          <br />
        </div>
      );

    case "user_joined":
      return (
        <div
          className="message system-info"
          title={timeStamp}  // Hover tooltip shows timestamp invisibly
        >
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
          {/* Show failure indicator + timestamp */}
          Something went wrong!
          <br />
          {timeStamp}
        </div>
      );

    default:
      // Unknown message type → render nothing
      return <></>;
  }
}

export default MessageItem;
