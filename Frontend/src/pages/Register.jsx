import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerThunk } from "../store/slices/authSlice.jsx";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Register.css";

export default function Register() {
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!email.trim()) return toast.error("Email is required");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return toast.error("Enter a valid email");
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");

    const res = await dispatch(registerThunk({ username, email, password }));
    if (registerThunk.fulfilled.match(res)) {
      toast.success("Registered. Please login");
      navigate("/login");
    } else {
      toast.error(res.payload || "Registration failed");
    }
  };

  return (
    <div className="register-wrap">
      <div className="register-card">
        <h1>Create your account</h1>
        <form className="register-form" onSubmit={onSubmit} noValidate>
          <div className="register-field">
            <label className="register-label" htmlFor="r-username">Username</label>
            <input id="r-username" className="register-input" placeholder="Apurv vats"
              value={username} onChange={(e)=>setU(e.target.value)} required autoComplete="username" />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="r-email">Email</label>
            <input id="r-email" className="register-input" type="email" placeholder="apurvvats@gmail.com"
              value={email} onChange={(e)=>setE(e.target.value)} required autoComplete="email" />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor="r-password">Password</label>
            <input id="r-password" className="register-input" type="password" placeholder="At least 6 characters"
              value={password} onChange={(e)=>setP(e.target.value)} required minLength={6} autoComplete="new-password" />
          </div>

          <button className="register-btn" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="register-helper">Have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}