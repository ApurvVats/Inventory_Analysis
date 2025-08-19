import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authRequired } from "../middleware/auth.js";
import uploadController from "../controllers/uploadController.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/:type", authRequired, upload.single("file"), uploadController.uploadFile);
router.get("/mine", authRequired, uploadController.listMyUploads);

export default router;