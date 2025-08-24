import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetPasswordThunk } from "../store/slices/authSlice";
import toast from "react-hot-toast";
import "./ResetPassword.css";
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add validation
    if (!email || !otp || !newPassword) {
      return toast.error("All fields are required");
    }
    if (newPassword.length < 6) {
        return toast.error("Password must be at least 6 characters")
    }
    const res = await dispatch(resetPasswordThunk({ email, otp, newPassword }));
    if (resetPasswordThunk.fulfilled.match(res)) {
      toast.success("Password reset successfully. Please login.");
      navigate("/login");
    } else {
      toast.error(res.payload || "Failed to reset password");
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Reset Your Password</h1>
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="auth-input"
          />
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
            className="auth-input"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}