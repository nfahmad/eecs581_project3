from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from server.websocket.manager import manager
from server.database import Message, get_db
from datetime import datetime
import json

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.get("/{room_id}/messages")
async def get_room_messages(room_id: int, max: int = 100, db: Session = Depends(get_db)):
    messages = db.query(Message).where(Message.room_id == room_id).limit(max).all()
    return messages

@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    user_id: int = Query(...),
    username: str = Query(...),
):
    """
    WebSocket endpoint for real-time chat in a room
    
    Query parameters:
    - user_id: ID of the user connecting
    - username: Username of the user connecting
    
    Example: ws://localhost:8000/ws/1?user_id=1&username=john
    """

    # Get the database connection
    db = next(get_db())

    try:

        # Connect user to room
        await manager.connect(websocket, room_id, user_id, username)


        # Notify the room that someone has joined
        await manager.broadcast_to_room(
            db,
            room_id,
            user_id,
            {
                "type": "user_joined",
                "user_id": user_id,
                "username": username,
                "timestamp": datetime.now().isoformat(),
                "message": f"{username} joined the room :)"
            }
        )
        
        # Listen for messages
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                content = message_data.get("content", "").strip()
                
                if not content:
                    continue
                
                # Broadcast message to all users in room
                await manager.broadcast_to_room(
                    db,
                    room_id,
                    user_id,
                    {
                        "type": "message",
                        "content": content,
                        "user_id": user_id,
                        "username": username,
                        "room_id": room_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
            except Exception as e:
                print(f"Error processing message: {e}")
    
    except WebSocketDisconnect:
        user_data = manager.disconnect(websocket)
        if user_data:
            # Notify room that user left
            await manager.broadcast_to_room(
                db,
                room_id,
                user_id,
                {
                    "type": "user_left",
                    "user_id": user_data["user_id"],
                    "username": user_data["username"],
                    "timestamp": datetime.now().isoformat(),
                    "message": f"{user_data['username']} left the room :("
                }
            )


