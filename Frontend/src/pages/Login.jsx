import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Login.css";
import { loginThunk, googleLoginThunk } from "../store/slices/authSlice.jsx";
import { GoogleLogin } from "@react-oauth/google";

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
  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    const res = await dispatch(googleLoginThunk({ idToken }));
    if (googleLoginThunk.fulfilled.match(res)) {
      toast.success("Logged in with Google");
      navigate("/");
    } else {
      toast.error(res.payload || "Google login failed");
    }
  };
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Login</h1>
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="l-username">
              Username
            </label>
            <input
              id="l-username"
              className="login-input"
              placeholder="Apurv vats"
              value={username}
              onChange={(e) => setU(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label className="login-label" htmlFor="l-password">
              Password
            </label>
            <input
              id="l-password"
              className="login-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setP(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
          <button className="login-btn" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="login-divider">or</div>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error("Google login failed. Please try again.");
            }}
            width="300px"
            theme="outline"
            size="large"
          />
        </div>
        <p className="login-helper">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
