import express from "express"
import { uploadReports } from "../controller/pathologistController.js";

const router = express.Router();

router.post("/upload", uploadReports);

export default router