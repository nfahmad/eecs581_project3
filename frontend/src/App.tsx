import { useState } from 'react';
import { Toaster } from 'sonner';
import ChatWindow from './components/ChatWindow';
import LoginHeader from './components/LoginHeader';
import { WebSocketProvider } from './providers/WebsocketProvider';
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
        position='top-right'
        toastOptions={{
          style: {
            backgroundColor: 'var(--bg-highlight)',
            border: '1px solid var(--fg-gutter)',
            color: 'var(--fg)',
          },
        }}
      />

      <LoginHeader setUser={setUser} setRoom={setRoomId}/>
      {user && roomId && (
        <WebSocketProvider url="ws://localhost:8000" roomId={roomId} userId={user.id} username={user.username}>
          <ChatWindow />
        </WebSocketProvider>
      )}
    </>
  )
}

export default App
