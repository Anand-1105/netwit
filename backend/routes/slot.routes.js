import express from "express";

import {
  bookSlot,
  deleteSlot,
  getAllBookedSlots,
  getCompanyData,
  getCompanySlotCounts,
  toggleCompletion,
} from "../controller/slot.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(`/booking-slot`, protectRoute, bookSlot);
router.delete(`/slot/delete/:id`, protectRoute, deleteSlot);
router.post(`/slot/get-all-booked-slots`, protectRoute, getAllBookedSlots);
router.post(`/slot/get-company-slot-counts`, protectRoute, getCompanySlotCounts);
router.post(`/slot/company/:company`, protectRoute, getCompanyData);
router.post(`/slot/toggle-completed/:id`, protectRoute, toggleCompletion);
export default router;
