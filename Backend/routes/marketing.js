// routes/marketing.js
import express from 'express';
import multer from 'multer';
import {authRequired } from '../middleware/auth.js';
import {
  createVariation, listVariations, getVariation, updateVariation, deleteVariation,
  uploadMarketing
} from '../controllers/marketingController.js';

const router = express.Router();
const upload = multer({ dest: process.env.UPLOAD_DIR || 'uploads' });

router.use(authRequired);

// Variations
router.post('/variations', createVariation);
router.get('/variations', listVariations);
router.get('/variations/:id', getVariation);
router.patch('/variations/:id', updateVariation);
router.delete('/variations/:id', deleteVariation);

// Marketing upload
router.post('/upload', upload.single('file'), uploadMarketing);

export default router;
