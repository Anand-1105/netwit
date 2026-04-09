import { User } from "../model/auth.model.js";

import { Events } from "../model/event.model.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        // Only allow admins to access this endpoint
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        // First get all users without password
        const users = await User.find({}, '-password -__v').lean();
        
        // Then get all events with minimal fields
        const allEvents = await Events.find({}, 'title _id startDate endDate assignedTo');
        
        // Map users with their events
        const usersWithEvents = users.map(user => {
            const userEvents = allEvents.filter(event => 
                event.assignedTo.some(id => id.toString() === user._id.toString())
            ).map(({ _id, title, startDate, endDate }) => ({
                _id,
                title,
                startDate,
                endDate
            }));
            
            return {
                ...user,
                events: userEvents
            };
        });

        res.status(200).json(usersWithEvents);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Delete a user (admin only)
export const deleteUser = async (req, res) => {
    try {
        // Only allow admins to access this endpoint
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const userId = req.params.id;
        
        // Prevent deleting self
        if (userId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

