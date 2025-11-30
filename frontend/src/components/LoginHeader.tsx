import type { User } from "../App";
import type { FormEvent } from "react";

import { useState } from "react";
import { toast } from "sonner";
import "./LoginHeader.css";

interface LoginHeaderProps {
  setUser: (user: User) => void;
}

function LoginHeader({ setUser }: LoginHeaderProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [signUpModal, setSignUpModal] = useState(false);
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

      if (res.status === 404) {
        const body = await res.json();
        toast.error(body.detail, {
          action: <button onClick={() => setSignUpModal(true)} className="submit-button">Sign Up?</button>
        })
        return;
      }

      if (res.body) {
        const body = await res.json();

        const user = body as User;
        setUser(user);
        setUsername("");
        setPassword("");
        setLoggedIn(true);
        // toast.success(`Welcome back ${user.username}!`);
        return;
      }

      toast.error("Didn't get anything in response...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to log in!")
    }  
  }

  const handleSignOut = () => {
    setUser(null);
    setLoggedIn(false);
    toast.info("Signed out")
  };


  return (
    <div className="login-container">
      <div className="logo-container">
        ¥apper
      </div>
      {loggedIn ? (
        <button
          className="submit-button"
          onClick={handleSignOut}
        >
          Sign Out
        </button> 
      ) : (
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
      )}
    </div>
  )
}

export default LoginHeader;
