import { useState } from 'react';
import { Toaster } from 'sonner';
import ChatWindow from './components/ChatWindow';
import LoginHeader from './components/LoginHeader';
import SideWindow from './components/SideWindow';
import { WebSocketProvider } from './providers/WebsocketProvider';
import CalvinHobbes from '../src/assets/calvin.svg?react'
import './App.css';

export interface User {
  username: string;
  email: string;
  id: number;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<number | null>(2);

  return (
    <>
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

      <LoginHeader setUser={setUser} />
      <div className='app-container'>
        {user && roomId ? (
          <WebSocketProvider url="ws://localhost:8000" roomId={roomId} userId={user.id} username={user.username}>
            <SideWindow onRoomChange={setRoomId} currentRoom={roomId} currentUser={user.id}/>
            <ChatWindow userId={user.id}/>
          </WebSocketProvider>
        ) : (
          <div className="alt-display-container">
            <CalvinHobbes />
            There's nothing here...
          </div>
        )}
      </div>
    </>
  )
}

export default App
