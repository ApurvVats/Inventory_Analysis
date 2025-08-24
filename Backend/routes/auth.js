import { Router } from "express";
import authController from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
// Rate limiter for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
const router = Router();
router.post("/send-register-otp", otpLimiter, authController.sendRegistrationOtp);
router.post("/forgot-password", otpLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authRequired, authController.me); 
router.post("/google-login", authController.googleLogin);
export default router;