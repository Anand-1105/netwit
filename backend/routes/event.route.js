import express from 'express';
import { createEvent, deleteEvent, getAllEvents, getEventById, getEventReport, getEventTitleList, updateEvent, uploadEventImage } from '../controller/event.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

// Create a new event
router.post('/', protectRoute, uploadEventImage, createEvent);

// Get all events
router.get('/',protectRoute, getAllEvents);

// Get a single event by ID
router.get('/event-list',protectRoute, getEventTitleList);
router.get('/:id', protectRoute, getEventById);

router.get('/report/:id',protectRoute, getEventReport);

// Delete an event by ID
router.delete('/:id', protectRoute, deleteEvent);

router.put('/:id', protectRoute, updateEvent);

export default router;