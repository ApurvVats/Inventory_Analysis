import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordThunk } from "../store/slices/authSlice";
import toast from "react-hot-toast";
import "./ForgotPassword.css";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const [message, setMessage] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    setMessage("");
    const res = await dispatch(forgotPasswordThunk({ email }));
    if (forgotPasswordThunk.fulfilled.match(res)) {
      toast.success("Request processed.");
      navigate("/reset-password"); 
    } else {
      toast.error(res.payload || "Failed to send reset link");
    }
  };
  return (
    <div className="auth-wrap"> {/* Use a generic auth-wrap class */}
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-sub-header">Enter your email to receive a password reset OTP.</p>
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}
        <p className="auth-helper"><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}