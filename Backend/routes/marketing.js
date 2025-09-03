import express from 'express';
import { authRequired } from '../middleware/auth.js';
import upload from "../middleware/fileUpload.js"; // Naya, centralized Azure middleware
import {
  createVariation, listVariations, getVariation, updateVariation, deleteVariation,
  uploadMarketing
} from '../controllers/marketingController.js';
const router = express.Router();
router.post('/variations', authRequired, createVariation);
router.get('/variations', authRequired, listVariations);
router.get('/variations/:id', authRequired, getVariation);
router.patch('/variations/:id', authRequired, updateVariation);
router.delete('/variations/:id', authRequired, deleteVariation);
router.post('/upload', authRequired, upload.single('file'), uploadMarketing);
export default router;