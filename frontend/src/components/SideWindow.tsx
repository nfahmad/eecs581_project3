import type { FormEvent } from "react";

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
  currentUser: number;
}

function SideWindow({ onRoomChange, currentRoom, currentUser }: SideWindowProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomModal, setRoomModal] = useState(false);
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

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          description: roomDesc,
          creator_id: currentUser,
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
    } finally {
      setRoomName("");
      setRoomDesc("");
      setRoomModal(false);
    }
  };

  const toggleModal = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setRoomModal(b => !b);
    }
  }
  
  // TODO: Add room update handler

  useEffect(() => {
    updateRooms();
  }, []);

  useEffect(() => {
    if (roomModal) {
      window.addEventListener('keydown', toggleModal);
    }

    return () => {
      window.removeEventListener('keydown', toggleModal);
    }
  }, [roomModal])

  return (
    <>
      {roomModal && (
        <div className="modal-backdrop" onClick={() => setRoomModal(false)}>
          <div className="modal-page" onClick={e => e.stopPropagation()}>
            <p>Enter Room Info</p>
            <form 
              onSubmit={handleFormSubmit}
              className="room-form"
            >
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="Room Name"
                className="room-input"
              />
              <input
                type="text"
                value={roomDesc}
                onChange={e => setRoomDesc(e.target.value)}
                placeholder="Room Description"
                className="room-input"
              />
              <button type="submit" className="submit-button">
                Add Room
              </button>
            </form>
          </div>
        </div>
      )}

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
          onClick={() => setRoomModal(true)}
        >
          +
        </button>
      </div>
    </>
  );
}

export default SideWindow;
