import express from 'express';
import { 
  getDashboardData, 
  getUsersListCompanywise, 
  getEventCompanies, 
  getEventSlots,
  getStatusDistribution
} from '../controller/dashboard.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get dashboard data - admin only
router.get('/', protectRoute, getDashboardData);
router.post('/users-slot/:eventId', protectRoute, getUsersListCompanywise);
router.get('/companies/:eventId', protectRoute, getEventCompanies);
router.get('/slots/:eventId', protectRoute, getEventSlots);
router.get('/status-distribution/:eventId?', protectRoute, getStatusDistribution);

export default router;