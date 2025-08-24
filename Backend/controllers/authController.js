// controllers/authController.js
import authService from "../services/authService.js"; // This service must also be converted to Prisma
import { prisma } from "../db/prisma.js";
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, username } = req.body;
    const result = await authService.sendRegistrationOtp({ email, username });
    res.status(200).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Failed to send OTP" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword({ email });
    res.status(200).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Failed to process request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword({ email, otp, newPassword });
    res.status(200).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Failed to reset password" });
  }
};

// Modify the existing register controller
const register = async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;
    const result = await authService.register({ username, email, password, otp });
    res.status(201).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Registration failed" });
  }
};
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const { token, user } = await authService.login({ username, password });
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1 * 24 * 3600 * 1000 })
      .json({ token, user });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ error: e.message || "Login failed" });
  }
};
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const { token, user } = await authService.loginWithGoogle({ idToken });
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1 * 24 * 3600 * 1000 })
      .json({ token, user });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ error: e.message || "Google login failed" });
  }
};
const logout = async (_req, res) => {
  res.clearCookie("token").json({ ok: true });
};
const me = async (req, res) => {
  try {
    // req.user is attached by the authRequired middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true } // Return only safe fields
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "An error occurred" });
  }
};

export default { register, login, googleLogin, logout, me,sendRegistrationOtp,forgotPassword,resetPassword};