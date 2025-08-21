// controllers/authController.js
import authService from "../services/authService.js"; // This service must also be converted to Prisma
import { prisma } from "../db/prisma.js";
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });
    res.status(201).json(result);
  } catch (e) {
    // Handle Prisma's unique constraint violation for 'username' or 'email'
    if (e?.code === 'P2002') {
      const field = e.meta?.target?.[0] || 'field';
      return res.status(409).json({ error: `${field} already exists` });
    }
    const code = e.status || 500;
    res.status(code).json({ error: e.message || "Registration failed" });
  }
};
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const { token, user } = await authService.login({ username, password });
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 7 * 24 * 3600 * 1000 })
      .json({ token, user });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ error: e.message || "Login failed" });
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

export default { register, login, logout ,me};
