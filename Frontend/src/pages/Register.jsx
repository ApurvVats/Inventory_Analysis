import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendRegistrationOtpThunk,
  registerThunk,
} from "../store/slices/authSlice.jsx";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Register.css";

export default function Register() {
  const [step, setStep] = useState(1); // 1 for details, 2 for OTP
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((s) => s.auth.loading);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    // Add validation for formData
    const { username, email, password } = formData;
    if (!username || !email || !password)
      return toast.error("All fields are required");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    const res = await dispatch(sendRegistrationOtpThunk({ username, email }));
    if (sendRegistrationOtpThunk.fulfilled.match(res)) {
      toast.success("OTP sent to your email!");
      setStep(2); // Move to OTP step
    } else {
      toast.error(res.payload || "Failed to send OTP");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("OTP is required");

    const finalData = { ...formData, otp };
    const res = await dispatch(registerThunk(finalData));
    if (registerThunk.fulfilled.match(res)) {
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } else {
      toast.error(res.payload || "Registration failed");
    }
  };

  return (
    <div className="register-wrap">
      <div className="register-card">
        {step === 1 ? (
          <>
            <h1>Create your account</h1>
            <form onSubmit={handleSendOtp} noValidate>
              {/* --- Field 1: Username --- */}
              <div className="register-field">
                <label className="register-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Aman Prakash"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* --- Field 2: Email --- */}
              <div className="register-field">
                <label className="register-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="amanalikedevil@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* --- Field 3: Password --- */}
              <div className="register-field">
                <label className="register-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Agj@_76ghty78"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>Verify your email</h1>
            <p>An OTP has been sent to {formData.email}</p>
            <form onSubmit={handleRegister} noValidate>
              <div className="register-field">
                 <label className="register-label" htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Create Account"}
              </button>
            </form>
            <button onClick={() => setStep(1)} className="link-button">
              Back
            </button>
          </>
        )}
        <p className="register-helper">
          Have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
