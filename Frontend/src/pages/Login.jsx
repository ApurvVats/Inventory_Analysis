import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk } from "../store/slices/authSlice.jsx";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Login.css";

export default function Login() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!password) return toast.error("Password is required");

    const res = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(res)) {
      toast.success("Logged in");
      navigate("/");
    } else {
      toast.error(res.payload || "Login failed");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Login</h1>
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="l-username">Username</label>
            <input id="l-username" className="login-input" placeholder="Apurv vats"
              value={username} onChange={(e)=>setU(e.target.value)} required autoComplete="username" />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="l-password">Password</label>
            <input id="l-password" className="login-input" type="password" placeholder="Your password"
              value={password} onChange={(e)=>setP(e.target.value)} required autoComplete="current-password" />
          </div>

          <button className="login-btn" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="login-helper">No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}
