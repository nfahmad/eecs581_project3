/**
 * Program: EECS 581 Project 3 - Live Chat Application
 * File: LoginHeader.tsx
 * Description:
 *    Top-level header component that:
 *      - Displays the application logo
 *      - Manages user authentication state (login / signup / logout)
 *      - Shows a modal dialog for login and sign-up forms
 *      - Communicates the authenticated user back up to the App via setUser
 *
 * Inputs:
 *    - setUser: (user: User) => void
 *        Callback from parent component (App) used to store the logged-in user.
 *
 * Outputs:
 *    - Updates global user state through setUser
 *    - Displays toast notifications for login/signup success and errors
 *
 * Author: EECS 581 Project 3 Team
 * Date: November 23, 2025
 */

import type { User } from "../App";
import type { FormEvent } from "react";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import "./LoginHeader.css";

interface LoginHeaderProps {
  setUser: (user: User | null) => void;
}

function LoginHeader({ setUser }: LoginHeaderProps) {
  // Tracks whether a user is currently logged in
  const [loggedIn, setLoggedIn] = useState(false);

  // Controls whether the login/signup modal is visible
  const [modalShown, setModalShown] = useState(false);

  // Which form is active inside the modal: "login" or "signup"
  const [form, setForm] = useState<"login" | "signup">("login");

  // Controlled input fields for login/sign-up forms
  const [email, setEmail] = useState<string>("");
  const [userName, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");

  /**
   * Handle login form submission.
   * Sends POST /login request to backend with username + password.
   * On success:
   *   - updates parent App user state
   *   - closes modal
   *   - sets loggedIn = true
   */
  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("Submitting...");

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userName,
          password: password,
        }),
      });

      // If backend returns 404, user does not exist
      if (res.status === 404) {
        const body = await res.json();
        toast.error(body.detail, {
          // Inline action button to quickly switch to sign-up
          action: (
            <button onClick={handleSignUp} className="submit-button">
              Sign Up?
            </button>
          ),
        });
        return;
      } else if (res.status === 400) {
        const body = await res.json();
        toast.error(body.detail)
        return;
      }

      // If response has a body, parse and treat as logged-in User
      if (res.body) {
        const body = await res.json();

        const user = body as User;
        setUser(user);            // Inform parent about new user
        setUsername("");          // Clear form inputs
        setPassword("");
        setLoggedIn(true);        // Update local auth flag
        setModalShown(false);     // Close modal
        // toast.success(`Welcome back ${user.username}!`);
        return;
      }

      // Fallback if response has no body
      toast.error("Didn't get anything in response...");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to log in!");
    }
  }

  /**
   * Handle sign-up form submission.
   * Sends POST /user request to create a new account.
   * On success:
   *   - sets new user in parent
   *   - clears fields
   *   - sets loggedIn = true
   *   - closes modal
   */
  async function handleSignUpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side validation: ensure password confirmation matches
    if (passwordConfirm !== password) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userName,
          email: email,
          password: password,
        }),
      });

      // Handle common error responses such as validation / uniqueness issues
      if (res.status === 404 || res.status === 400) {
        const body = await res.json();
        toast.error(body.detail);
        return;
      }

      // If request succeeded and has a body, treat as created user
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

      toast.error("Didn't get anything in response...");
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong trying to sign up!");
    }
  }

  /**
   * Sign-out handler:
   *  - Clears global user from parent App
   *  - Resets loggedIn flag
   *  - Displays toast notification
   */
  const handleSignOut = () => {
    setUser(null);
    setLoggedIn(false);
    toast.info("Signed out");
  };

  /**
   * Switch to sign-up form and open modal.
   */
  const handleSignUp = () => {
    setForm("signup");
    setModalShown(true);
  };

  /**
   * Switch to login form and open modal.
   */
  const handleLogIn = () => {
    setForm("login");
    setModalShown(true);
  };

  /**
   * Simple validation helper for login form.
   * Ensures username + password are not empty.
   */
  const canLogin = () => {
    return userName.length > 0 && password.length > 0;
  };

  /**
   * Simple validation helper for sign-up form.
   * Enforces non-empty username, email, password
   * and checks that password confirmation matches length.
   */
  const canSignUp = () => {
    return (
      userName.length > 0 &&
      email.length > 0 &&
      password.length > 0 &&
      passwordConfirm.length == password.length
    );
  };

  /**
   * Keydown handler to close modal via Escape key.
   * Registered when modal is open; removed when closed.
   */
  const toggleModal = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setModalShown((b) => !b);
    }
  };

  /**
   * Side-effect to attach / detach global keydown listener
   * When the modal is visible, allow user to close it with Escape.
   */
  useEffect(() => {
    if (modalShown) {
      window.addEventListener("keydown", toggleModal);
    }

    return () => {
      window.removeEventListener("keydown", toggleModal);
    };
  }, [modalShown]);

  return (
    <>
      {/* Modal overlay for login / sign-up forms */}
      {modalShown && (
        <div
          className="modal-backdrop"
          onClick={() => setModalShown(false)} // Click outside to close modal
        >
          {/* Prevent clicks inside dialog from closing modal */}
          <div className="modal-page" onClick={(e) => e.stopPropagation()}>
            {/* Login form view */}
            {form === "login" && (
              <>
                <p>Login</p>
                <form onSubmit={handleLoginSubmit} className="form-container">
                  <input
                    name="username"
                    type="text"
                    value={userName}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="input username"
                  />
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="input password"
                  />
                  <span className="button-group">
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={!canLogin()}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className="submit-button offhand"
                      onClick={handleSignUp}
                    >
                      Sign Up
                    </button>
                  </span>
                </form>
              </>
            )}

            {/* Sign-up form view */}
            {form === "signup" && (
              <>
                <p>Sign Up</p>
                <form onSubmit={handleSignUpSubmit} className="form-container">
                  <input
                    name="username"
                    type="text"
                    value={userName}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="input username"
                  />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="input email"
                  />
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="input password"
                  />
                  <input
                    name="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Password Confirmation"
                    className="input password"
                  />
                  <span className="button-group">
                    <button
                      type="button"
                      className="submit-button offhand"
                      onClick={handleLogIn}
                    >
                      Login
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={!canSignUp()}
                    >
                      Sign Up
                    </button>
                  </span>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header bar with logo and login/logout button */}
      <div className="login-container">
        <div className="logo-container">
          ¥apper
        </div>

        {loggedIn ? (
          <button className="submit-button" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="submit-button" onClick={handleLogIn}>
            Log In
          </button>
        )}
      </div>
    </>
  );
}

export default LoginHeader;
