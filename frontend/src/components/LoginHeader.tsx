import type { User } from "../App";
import type { FormEvent } from "react";

import { useState } from "react";
import { toast } from "sonner";
import "./LoginHeader.css";

interface LoginHeaderProps {
  setUser: (user: User) => void;
  setRoom: (room: number) => void;
}

function LoginHeader({ setUser }: LoginHeaderProps) {
  const [userName, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Submitting...");

    try {
      const res = await fetch('http://localhost:8000/login', {
        method: "POST",
          headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userName,
          password: password,
        })
      });

      if (res.body) {
        const res_body = await res.json();

        if (res_body.detail) {
          toast.error(res_body.detail);
          return;
        }

        setUser(res_body as User);
        setUsername("");
        setPassword("");
        return;
      }

      toast.error("Didn't get anything in response...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to log in!")
    }  
  }


  return (
    <div className="login-container">
      <form onSubmit={handleFormSubmit} className="form-container">
        <input
          type="text" 
          value={userName}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username" 
          className="input username"
        />
        <input
          type="password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password" 
          className="input password"
        />
        <button type="submit" className="submit-button">
          Login
        </button>
      </form>
    </div>
  )
}

export default LoginHeader;
