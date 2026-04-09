import express from 'express';
import { deleteUser, getAllUsers } from '../controller/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply verifyToken middleware to all routes in this file
router.use(protectRoute);

// Get all users (admin only)
router.get('/', getAllUsers);

// Delete a user (admin only)
router.delete('/:id', deleteUser);

export default router;
