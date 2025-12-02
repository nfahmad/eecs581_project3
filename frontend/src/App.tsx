/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: App.tsx
 * Description:
 *    Root component for the SPA (Single-Page Application). Responsible for:
 *      - Managing global authentication state (user login/logout)
 *      - Tracking selected chat room for the current session
 *      - Conditionally enabling WebSocketProvider only when authenticated
 *      - Structuring UI layout (Header + Sidebar + Chat Window)
 *      - Displaying fallback content when user/room is not available
 *
 * Inputs: None directly — this is the application entry point.
 *
 * Outputs:
 *    - Renders entire real-time chat UI structure once user is authenticated.
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

import { useState } from 'react';
import { Toaster } from 'sonner'; // Global toast notification manager

import ChatWindow from './components/ChatWindow';
import LoginHeader from './components/LoginHeader';
import SideWindow from './components/SideWindow';
import { WebSocketProvider } from './providers/WebsocketProvider';

import CalvinHobbes from '../src/assets/calvin.svg?react'; // Fun fallback illustration
import './App.css';

// Shape of a logged-in user object (synced with backend response)
export interface User {
  username: string;
  email: string;
  id: number;
}

function App() {
  // Tracks whether a user is currently logged in
  const [user, setUser] = useState<User | null>(null);

  // Tracks the currently selected chat room
  // Defaulting to room 2, but room selector updates this
  const [roomId, setRoomId] = useState<number | null>(2);

  return (
    <>
      {/* Toast UI configuration (applies theme styles) */}
      <Toaster 
        position='top-center'
        toastOptions={{
          style: {
            backgroundColor: 'var(--bg-highlight)',
            border: '1px solid var(--fg-gutter)',
            color: 'var(--fg)',
          },
        }}
      />

      {/* Header login/logout UI */}
      <LoginHeader setUser={setUser} />

      <div className='app-container'>
        {/* If a user is logged in + a room is selected => enable chat UI */}
        {user && roomId ? (
          // Provide WebSocket context only when authenticated + in a room
          <WebSocketProvider 
            url="ws://localhost:8000"
            roomId={roomId}
            userId={user.id}
            username={user.username}
          >
            {/* Sidebar navigation for rooms */}
            <SideWindow 
              onRoomChange={setRoomId}
              currentRoom={roomId}
              currentUser={user.id}
            />

            {/* Main message window with input field */}
            <ChatWindow userId={user.id}/>
          </WebSocketProvider>
        ) : (
          // Otherwise show welcome / idle message in center of page
          <div className="alt-display-container">
            <CalvinHobbes />
            There's nothing here...
          </div>
        )}
      </div>
    </>
  );
}

export default App;

