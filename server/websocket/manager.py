from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping room_id to list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Dictionary mapping WebSocket to user info
        self.user_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket, room_id: int, user_id: int, username: str):
        """Accept WebSocket connection and add to room"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        self.user_info[websocket] = {
            "user_id": user_id,
            "username": username,
            "room_id": room_id
        }
        
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection from room"""
        if websocket in self.user_info:
            user_data = self.user_info[websocket]
            room_id = user_data["room_id"]
            
            if room_id in self.active_connections:
                self.active_connections[room_id].remove(websocket)
                
                # Clean up empty rooms
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
            
            del self.user_info[websocket]
            return user_data
        return None
    
    
    async def broadcast_to_room(self, room_id: int, message: dict):
        """Broadcast message to all connections in a room"""
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to connection: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected websockets
            for connection in disconnected:
                self.disconnect(connection)
    

# Global connection manager instance
manager = ConnectionManager()
