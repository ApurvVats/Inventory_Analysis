import express from "express";
import { authRequired } from "../middleware/auth.js";
import upload from "../middleware/fileUpload.js"; // Naya, centralized Azure middleware
import { 
    uploadInventory, 
    uploadInventoryVendor, 
    availability, 
    view 
} from "../controllers/inventoryController.js";
const router = express.Router();
// Local multer setup hata diya gaya hai
router.post("/upload", authRequired, upload.single("file"), uploadInventory);
router.post("/upload-vendor", authRequired, upload.single("file"), uploadInventoryVendor);

router.get("/availability", authRequired, availability);
router.get("/view", authRequired, view);
export default router;