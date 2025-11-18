import { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import { WebSocketProvider } from './providers/WebsocketProvider'
import './App.css'

export interface User {
  username: string;
  email: string;
  id: number;
};

function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <>
      
      {user && (
        <WebSocketProvider url="ws://localhost:8000" roomId={2} userId={2} username="bob">
          <ChatWindow />
        </WebSocketProvider>
      )}
    </>
  )
}

export default App
