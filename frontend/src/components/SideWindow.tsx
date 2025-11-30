import { useState, useEffect } from "react";
import { toast } from "sonner";
import "./SideWindow.css";

interface Room {
  id: number;
  name: string;
  description: string;
}

interface SideWindowProps {
  onRoomChange: (roomId: number) => void;
  currentRoom: number;
}

function SideWindow({ onRoomChange, currentRoom }: SideWindowProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [roomDesc, setRoomDesc] = useState<string>("");

  const updateRooms = async () => {
    try {
      const res = await fetch('http://localhost:8000/room');

      if (res.body) {
        const res_body = await res.json();

        if (res_body.detail) {
          toast.error(res_body.detail);
          return;
        }

        setRooms(res_body);
        return;
      }

      toast.error("Didn't get valid response looking for rooms...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to get rooms!")
    }  
  };

  const addRoom = async () => {
    try {
      const res = await fetch('http://localhost:8000/room', {
        method: 'POST',
        body: JSON.stringify({
          name: roomName,
          description: roomDesc,
          creator_id: 2,
        })
      });

      if (res.body) {
        const body = await res.json();

        if (body.detail) {
          toast.error(body.detail);
          return;
        }

        setRooms(rooms => [...rooms, body]);
        return;
      }

      toast.error("Invalid response when creating room...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to create a room!")
    }  
  };

  useEffect(() => {
    updateRooms();
  }, []);

  return (
    <div className="sidebar-container">
      <p className="subtitle">Rooms</p>
      {rooms.map(room => (
        <button 
          title={room.description}
          className={"room-select-button " + (currentRoom === room.id ? "active-room" : "")}
          key={`room-button-${room.id}`}
          onClick={() => onRoomChange(room.id)}
        >
          {room.name}
        </button>
      ))}
      <button 
        className="room-select-button add-room-button"
        onClick={() => addRoom()}
      >
        +
      </button>
    </div>
  );
}

export default SideWindow;
