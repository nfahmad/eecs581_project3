from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from server.database import init_db
from server.websocket.routes import router as ws_router

class ReqUser(BaseModel):
    name: str
    email: str

app = FastAPI(title="¥apper")


test_page = HTMLResponse("""
<!DOCTYPE html>
<html>
<head>
    <title>Chat Room WebSocket Client</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        #connection-form {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        #connection-form label {
            font-weight: bold;
        }
        #connection-form input {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        #roomId {
            width: 100px;
        }
        #username {
            width: 200px;
        }
        #messages {
            height: 400px;
            border: 1px solid #ccc;
            overflow-y: auto;
            padding: 10px;
            margin-bottom: 10px;
            background: #f9f9f9;
        }
        .message {
            margin: 5px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
        }
        .system-message {
            background: #e3f2fd;
            font-style: italic;
        }
        .message-header {
            font-weight: bold;
            color: #1976d2;
        }
        .message-time {
            font-size: 0.8em;
            color: #666;
        }
        #input-container {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        button {
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #1565c0;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        #status {
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .connected {
            background: #c8e6c9;
        }
        .disconnected {
            background: #ffcdd2;
        }
        #users-list {
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Chat Room WebSocket Client</h1>
    
    <div id="connection-form">
        <label for="roomId">Room Number:</label>
        <input type="number" id="roomId" placeholder="Room ID" value="1">
        <label for="username">Username:</label>
        <input type="text" id="username" placeholder="Username" value="john">
        <button onclick="connect()">Connect</button>
    </div>

    <div id="status" class="disconnected">Disconnected</div>
    
    <div id="users-list" style="display:none;">
        <strong>Active Users:</strong>
        <span id="users"></span>
    </div>

    <div id="messages"></div>

    <div id="input-container">
        <input type="text" id="messageInput" placeholder="Type a message..." disabled>
        <button id="sendBtn" onclick="sendMessage()" disabled>Send</button>
    </div>

    <script>
        let ws = null;
        let roomId, userId, username;

        function connect() {
            roomId = document.getElementById('roomId').value;
            username = document.getElementById('username').value;
            userId = 1; // Hardcoded for now

            if (!roomId || !username) {
                alert('Please fill in all fields');
                return;
            }

            const wsUrl = `ws://localhost:8000/ws/${roomId}?user_id=${userId}&username=${encodeURIComponent(username)}`;
            ws = new WebSocket(wsUrl);

            ws.onopen = function(event) {
                document.getElementById('status').textContent = `Connected to Room ${roomId}`;
                document.getElementById('status').className = 'connected';
                document.getElementById('messageInput').disabled = false;
                document.getElementById('sendBtn').disabled = false;
                document.getElementById('users-list').style.display = 'block';
                addSystemMessage('Connected to chat room');
            };

            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'message':
                        addMessage(data);
                        break;
                    case 'user_joined':
                    case 'user_left':
                        addSystemMessage(data.message);
                        break;
                    case 'room_users':
                        updateUsersList(data.users);
                        break;
                    case 'error':
                        addSystemMessage('Error: ' + data.message);
                        break;
                }
            };

            ws.onclose = function(event) {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').className = 'disconnected';
                document.getElementById('messageInput').disabled = true;
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('users-list').style.display = 'none';
                addSystemMessage('Disconnected from chat room');
            };

            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                addSystemMessage('Connection error');
            };
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();

            if (content && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    content: content,
                    type: 'message'
                }));
                input.value = '';
            }
        }

        function addMessage(data) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            
            const time = new Date(data.timestamp).toLocaleTimeString();
            messageDiv.innerHTML = `
                <div class="message-header">${data.username} <span class="message-time">${time}</span></div>
                <div>${data.content}</div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function addSystemMessage(message) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system-message';
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateUsersList(users) {
            const usersSpan = document.getElementById('users');
            usersSpan.textContent = users.map(u => u.username).join(', ');
        }

        // Allow sending message with Enter key
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
""")

# Execute before/after the lifetime of the app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initalize the database
    init_db()
    print("Database initialized successfully")

    yield

app.include_router(ws_router)

@app.get("/")
async def index_page():
    return test_page

