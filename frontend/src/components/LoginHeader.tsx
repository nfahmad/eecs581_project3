import type { User } from "../App";
import type { FormEvent } from "react";

import { useState } from "react";

interface LoginHeaderProps {
  setUser: (user: User) => void;
}

function LoginHeader({ setUser }: LoginHeaderProps) {
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8000/login', {
        method: "POST",
        body: JSON.stringify({
          userName, password
        })
      });

      setUser()
    } catch (err) {

    } finally {

    }
  }


  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <input
          type="text" 
          value={userName}
          onChange={e => setUserName(e.target.value)}
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
      </form>
    </div>
  )
}

export default LoginHeader;
