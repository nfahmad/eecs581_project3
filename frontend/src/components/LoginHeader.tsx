import type { User } from "../App";
import type { FormEvent } from "react";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import "./LoginHeader.css";

interface LoginHeaderProps {
  setUser: (user: User) => void;
}

function LoginHeader({ setUser }: LoginHeaderProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [modalShown, setModalShown] = useState(false);
  const [form, setForm] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState<string>("");
  const [userName, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
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
          action: <button onClick={() => setModalShown(true)} className="submit-button">Sign Up?</button>
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
        setModalShown(false);
        // toast.success(`Welcome back ${user.username}!`);
        return;
      }

      toast.error("Didn't get anything in response...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to log in!")
    }  
  }

  async function handleSignUpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (passwordConfirm !== password) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/user', {
        method: "POST",
          headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userName,
          email: email,
          password: password,
        })
      });

      if (res.status === 404 || res.status === 400) {
        const body = await res.json();
        toast.error(body.detail)
        return;
      }

      if (res.body) {
        const body = await res.json();

        const user = body as User;
        setUser(user);
        setUsername("");
        setEmail("");
        setPassword("");
        setPasswordConfirm("");
        setLoggedIn(true);
        setModalShown(false);
        // toast.success(`Welcome back ${user.username}!`);
        return;
      }

      toast.error("Didn't get anything in response...")

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to sign up in!")
    }  
  }

  const handleSignOut = () => {
    setUser(null);
    setLoggedIn(false);
    toast.info("Signed out")
  };

  const handleLogIn = () => {
    setForm("login")
    setModalShown(true);
  }

  const canLogin = () => {
    return userName.length > 0 && password.length > 0;
  };

  const canSignUp = () => {
    return userName.length > 0 
      && email.length > 0
      && password.length > 0
      && passwordConfirm.length == password.length;
  };

  const toggleModal = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setModalShown(b => !b);
    }
  }

  useEffect(() => {
    if (modalShown) {
      window.addEventListener('keydown', toggleModal);
    }

    return () => {
      window.removeEventListener('keydown', toggleModal);
    }
  }, [modalShown])


  return (
    <>
      {modalShown && (
        <div className="modal-backdrop" onClick={() => setModalShown(false)}>
          <div className="modal-page" onClick={e => e.stopPropagation()}>
            {form === "login" && (
              <>
                <p>Login</p>
                <form onSubmit={handleLoginSubmit} className="form-container">
                  <input
                    name="username"
                    type="text" 
                    value={userName}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username" 
                    className="input username"
                  />
                  <input
                    name="password"
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="input password"
                  />
                  <span className="button-group">
                    <button type="submit" className="submit-button" disabled={!canLogin()}>
                      Login
                    </button>
                    <button type="button" className="submit-button offhand" onClick={() => setForm('signup')}>
                      Sign Up
                    </button>
                  </span>
                </form>
              </>
            )}

            {form === "signup" && (
              <>
                <p>Sign Up</p>
                <form onSubmit={handleSignUpSubmit} className="form-container">
                  <input
                    name="username"
                    type="text" 
                    value={userName}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username" 
                    className="input username"
                  />
                  <input
                    name="email"
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email" 
                    className="input email"
                  />
                  <input
                    name="password"
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="input password"
                  />
                  <input
                    name="password-confirm"
                    type="password" 
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Password Confirmation" 
                    className="input password"
                  />
                  <span className="button-group">
                    <button type="button" className="submit-button offhand" onClick={() => setForm('login')}>
                      Login
                    </button>
                    <button type="submit" className="submit-button" disabled={!canSignUp()}>
                      Sign Up
                    </button>
                  </span>
                </form>
              </>
            )}
          </div>
        </div>
      )}

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
          <button
            className="submit-button"
            onClick={handleLogIn}
          >
            Log In
          </button> 
        )}
      </div>
    </>
  )
}

export default LoginHeader;
