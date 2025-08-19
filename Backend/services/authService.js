import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js"; 
const emailRegex = /^\S+@\S+\.\S+$/;
const register = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    const err = new Error("Username, email, and password are required");
    err.status = 400; throw err;
  }
  if (!emailRegex.test(email)) {
    const err = new Error("Invalid email");
    err.status = 400; throw err;
  }
  if (String(password).length < 6) {
    const err = new Error("Password must be at least 6 characters");
    err.status = 400; throw err;
  }
  // --- Prisma Pre-check ---
  const byUsername = await prisma.user.findUnique({ where: { username } });
  if (byUsername) {
    const err = new Error("Username taken");
    err.status = 409; throw err;
  }
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    const err = new Error("Email already registered");
    err.status = 409; throw err;
  }

  // --- Prisma Create ---
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  return { id: user.id, username: user.username };
};
const login = async ({ username, password }) => {
  // --- Prisma Find ---
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401; throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401; throw err;
  }

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
};
export default { register, login };