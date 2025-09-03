import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listMyUploads } from "../controllers/uploadController.js";
const router = Router();
router.get("/mine", authRequired, listMyUploads);
export default router;