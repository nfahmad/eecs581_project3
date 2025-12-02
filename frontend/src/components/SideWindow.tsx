/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: SideWindow.tsx
 * Description:
 *    Sidebar component that:
 *      - Displays a list of available chat rooms
 *      - Allows the user to switch between rooms
 *      - Provides a modal form for creating new rooms
 *
 * Inputs (props):
 *    - onRoomChange: (roomId: number) => void
 *        Callback to notify parent component when room selection changes.
 *    - currentRoom: number
 *        ID of the currently active room, used for highlighting.
 *    - currentUser: number
 *        ID of the current logged-in user (used as creator_id when making rooms).
 *
 * Outputs:
 *    - Invokes onRoomChange when room buttons are clicked.
 *    - Sends network requests to backend to fetch and create rooms.
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

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
  // List of rooms fetched from backend
  const [rooms, setRooms] = useState<Room[]>([]);

  // Controls visibility of the "Add Room" modal
  const [roomModal, setRoomModal] = useState(false);

  // Controlled form inputs for new room data
  const [roomName, setRoomName] = useState<string>("");
  const [roomDesc, setRoomDesc] = useState<string>("");

  /**
   * Fetch the current list of rooms from the backend.
   * Called on initial mount and may be reused later to refresh the list.
   */
  const updateRooms = async () => {
    try {
      const res = await fetch("http://localhost:8000/room");

      if (res.body) {
        const res_body = await res.json();

        // Backend error message case
        if (res_body.detail) {
          toast.error(res_body.detail);
          return;
        }

        // Successful response → update rooms state
        setRooms(res_body);
        return;
      }

      toast.error("Didn't get valid response looking for rooms...");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to get rooms!");
    }
  };

  /**
   * Handle submission of the "Add Room" form.
   * Sends a POST request to create a new room using the currentUser as creator.
   */
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8000/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          description: roomDesc,
          creator_id: currentUser,
        }),
      });

      if (res.body) {
        const body = await res.json();

        // Display server-side validation/constraint errors if present
        if (body.detail) {
          toast.error(body.detail);
          return;
        }

        // Append newly created room to current list
        setRooms((rooms) => [...rooms, body]);
        return;
      }

      toast.error("Invalid response when creating room...");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to create a room!");
    } finally {
      // Reset form and close modal regardless of success/failure
      setRoomName("");
      setRoomDesc("");
      setRoomModal(false);
    }
  };

  /**
   * Handle ESC key press to toggle (close) the room modal.
   * Only active while the modal is open.
   */
  const toggleModal = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setRoomModal((b) => !b);
    }
  };

  // TODO: Add room update handler (e.g., renaming rooms)

  /**
   * On initial mount, fetch the list of rooms from the server.
   */
  useEffect(() => {
    updateRooms();
  }, []);

  /**
   * When the room creation modal is visible, attach an Escape key listener
   * to allow closing it using the keyboard. Clean up on close/unmount.
   */
  useEffect(() => {
    if (roomModal) {
      window.addEventListener("keydown", toggleModal);
    }

    return () => {
      window.removeEventListener("keydown", toggleModal);
    };
  }, [roomModal]);

  return (
    <>
      {/* Room creation modal (overlay) */}
      {roomModal && (
        <div
          className="modal-backdrop"
          onClick={() => setRoomModal(false)} // Click outside to close
        >
          {/* Stop click propagation so clicks inside modal do not close it */}
          <div className="modal-page" onClick={(e) => e.stopPropagation()}>
            <p>Enter Room Info</p>
            <form onSubmit={handleFormSubmit} className="room-form">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
                className="room-input"
              />
              <input
                type="text"
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
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

      {/* Sidebar displaying list of rooms and add-room button */}
      <div className="sidebar-container">
        <p className="subtitle">Rooms</p>

        {/* Render a button for each room; highlight the active room */}
        {rooms.map((room) => (
          <button
            title={room.description}
            className={
              "room-select-button " +
              (currentRoom === room.id ? "active-room" : "")
            }
            key={`room-button-${room.id}`}
            onClick={() => onRoomChange(room.id)}
          >
            {room.name}
          </button>
        ))}

        {/* Button to open the "Add Room" modal */}
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

