import express from "express";
import {
  uploadFile,
  getFileData,
  deleteAllUsers,
  updateUserStatusByEmail,
  updateUser,
  deleteUser
  // getCompanyData,
} from "../controller/file.controller.js";
import multer from "multer";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB cap

// Upload file route
router.post("/upload-file/:event", protectRoute, upload.single("file"), uploadFile);

// Get file data route
router.get("/get-filedata/:event",protectRoute, getFileData);
router.delete("/delete-filedata/:event",protectRoute, deleteAllUsers);
router.post("/update-status",updateUserStatusByEmail)

// Update a user by ID
router.put("/user/:id",protectRoute, updateUser);
// Delete a user by ID
router.delete("/user/:id",protectRoute, deleteUser);

// router.get(`/company/:companyName`, getCompanyData);`

export default router;
