import { Router } from "express";
import authController from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js"; // Make sure authRequired is imported
const router = Router();
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authRequired, authController.me); // NEW: Route to get current user
export default router;