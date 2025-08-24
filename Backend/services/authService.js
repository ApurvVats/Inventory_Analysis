import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { OAuth2Client } from "google-auth-library";
import { sendMail } from "../utils/mailer.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateAndStoreOtp = async (email, type) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otp.deleteMany({ where: { email, type } });
  // Create the new OTP record
  await prisma.otp.create({
    data: { email, otpHash, expiresAt, type },
  });
  return otp; // Return the plain OTP to be sent via email
};
const sendRegistrationOtp = async ({ email, username }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Username";
    const err = new Error(`${field} is already taken`);
    err.status = 409;
    throw err;
  }
  const otp = await generateAndStoreOtp(email, "REGISTER");
  // Send the email
  await sendMail({
    to: email,
    subject: "Verify Your Account - Daynexa",
    text: `Your OTP for account registration is: ${otp}. It will expire in 10 minutes.`,
    html: `<b>Your OTP is: ${otp}</b><p>It will expire in 10 minutes.</p>`,
  });

  return { message: `OTP sent to ${email}` };
};
const register = async ({ username, email, password, otp }) => {
  // Verify OTP
  const record = await prisma.otp.findFirst({ where: { email, type: "REGISTER" } });
  if (!record) {
    const err = new Error("No OTP found or it has expired. Please try again.");
    err.status = 400; throw err;
  }
  if (new Date() > record.expiresAt) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.status = 400; throw err;
  }
  const isOtpValid = await bcrypt.compare(otp, record.otpHash);
  if (!isOtpValid) {
    const err = new Error("Invalid OTP.");
    err.status = 400; throw err;
  }
  if (password.length < 6) {
    const err = new Error("Password must be at least 6 characters long.");
    err.status = 400; throw err;
  }
  // Create user
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });
  // Clean up OTP
  await prisma.otp.delete({ where: { id: record.id } });
  return { message: "User registered successfully. Please login." };
};  
const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // For security, don't reveal if the email exists.
    return { message: `If an account with ${email} exists, an OTP has been sent.` };
  }
  
  if (!user.passwordHash) {
    // User signed up with Google, can't reset password this way.
    return { message: "This account was created using Google Sign-In. Please log in with Google."}
  }

  const otp = await generateAndStoreOtp(email, "RESET_PASSWORD");

  await sendMail({
    to: email,
    subject: "Reset Your Password - Daynexa",
    text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
    html: `<b>Your password reset OTP is: ${otp}</b><p>It will expire in 10 minutes.</p>`,
  });

  return { message: `If an account with ${email} exists, an OTP has been sent.` };
};
const resetPassword = async ({ email, otp, newPassword }) => {
  // Verify OTP
  const record = await prisma.otp.findFirst({ where: { email, type: "RESET_PASSWORD" } });
  if (!record) {
    const err = new Error("Invalid or expired OTP. Please try again.");
    err.status = 400; throw err;
  }
  if (new Date() > record.expiresAt) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.status = 400; throw err;
  }
  const isOtpValid = await bcrypt.compare(otp, record.otpHash);
  if (!isOtpValid) {
    const err = new Error("Invalid OTP.");
    err.status = 400; throw err;
  }

  // Update password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  // Clean up OTP
  await prisma.otp.delete({ where: { id: record.id } });

  return { message: "Password has been reset successfully. Please login." };
};

const login = async ({ username, password }) => {
  // --- Prisma Find ---
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
};
const loginWithGoogle = async ({ idToken }) => {
    if (!idToken) {
      const err = new Error("Google ID token is required");
      err.status = 400;
      throw err;
    }
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      const err = new Error("Invalid Google token or email not found");
      err.status = 400;
      throw err;
    }
    const { email, name } = payload;
    // Find user by email
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      let username =
        name.replace(/\s/g, "").toLowerCase() || email.split("@")[0];
      const userExists = await prisma.user.findUnique({ where: { username } });
      if (userExists) {
        username = `${username}_${Date.now().toString().slice(-4)}`;
      }
      user = await prisma.user.create({
        data: {
          email,
          username,
        },
      });
    }
    // Issue your own JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    };

};
export default {
  sendRegistrationOtp, 
  register,
  login,
  loginWithGoogle,
  forgotPassword,      
  resetPassword,    
};