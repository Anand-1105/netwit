import mongoose from "mongoose";
import { Slots } from "../model/Slots.js";
import { UserCollection } from "../model/filedata.model.js";

// Escape special regex characters to prevent ReDoS
const escapeRegex = (s) => s.split("").map(c => "\.+*?^${}()|[]\\".indexOf(c) !== -1 ? "\\" + c : c).join("");
export const deleteSlot = async (req, res) => {
  try {
    const userId = req.params.id;
    const { slotTime,event } = req.body;

    if (!userId || !slotTime||!event) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find and delete the slot
    const deletedSlot = await Slots.findOneAndDelete({
      userId: userId,
      timeSlot: slotTime,
      event
    });

    if (!deletedSlot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    const user = await UserCollection.findByIdAndUpdate(deletedSlot.userId,{status:"pending"});
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getCompanyData = async (req, res) => {
  try {
    const companyName = req.params.company.trim();
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: "Event id is required" });
    }

    // Case-insensitive, trimmed match using escaped company name
    const slots = await Slots.find({
      company: { $regex: `^${escapeRegex(companyName)}$`, $options: 'i' },
      event
    }).populate(
      {path:"userId",
      select:"serialNo firstName lastName company title email phone selectedBy giftBy comment giftCollected",
      populate: {
        path: "giftBy",
        select: "username"
      }
    });

    return res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching company data:", error);
    return res.status(500).json({ message: "Error fetching company data" });
  }
};

export const bookSlot = async (req, res) => {
  try {
    const { userId, company,event, timeSlot } = req.body;

    if (!userId || !timeSlot||!event||!company) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingTimeSlot = await Slots.findOne({event, timeSlot, userId });
    if (existingTimeSlot) {
      return res
        .status(400)
        .json({ error: "Slot already booked please choose another slot" });
    }
    // Prevent booking same company and time for the same event by any user
    const existingCompanyTime = await Slots.findOne({ event, company, timeSlot });
    if (existingCompanyTime) {
      return res
        .status(400)
        .json({ error: "This time is already booked for the selected company" });
    }
    const existingSlot = await Slots.findOne({event, userId, company });

    if (existingSlot) {
      return res
        .status(400)
        .json({ error: "Slot with same company already booked" });
    }

    const newSlot = new Slots({ userId, company, timeSlot,event });
    try {
      await newSlot.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "This slot was just taken by another user. Please choose another time." });
      }
      throw err;
    }
    const user = await UserCollection.findByIdAndUpdate(userId,{status:"scheduled"});
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(201).json({ message: "Slot booked successfully" });
  } catch (error) {
    console.error("Error booking slot:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getAllBookedSlots = async (req, res) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: "Event id is required" });
    }
    const slots = await Slots.find({event});
    res.json(slots);
  } catch (error) {
    console.error("Error fetching all booked slots:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCompanySlotCounts = async (req, res) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: "Event id is required" });
    }
    
    // Aggregate to get unique companies with their slot counts
    const companyCounts = await Slots.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(event) } },
      {
        $group: {
          _id: "$company",
          slotCount: { $sum: 1 },
          // You can include other aggregations if needed, like:
          // completedSlots: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } }
        }
      },
      { $sort: { slotCount: -1 } }, // Sort by slot count descending
      {
        $project: {
          _id: 0,
          company: "$_id",
          slotCount: 1
        }
      }
    ]);
    
    res.json(companyCounts);
  } catch (error) {
    console.error("Error fetching company slot counts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// export const getCompanyData = async (req, res) => {
//   try {
//     const companyName = req.params.companyName.toLowerCase();

//     // Find slots for the company and populate user data
//     const slots = await Slots.find({ company: companyName }).populate("userId");
//     const users = slots
//       .map((slot) => slot.userId)
//       .filter((user) => user !== null);

//     res.json(users);
//   } catch (error) {
//     console.error("Error fetching company data:", error);
//     res.status(500).json({ message: "Error fetching company data" });
//   }
// };

export const toggleCompletion = async (req, res) => {
  try {
    const slotId = req.params.id;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: "Completed status must be a boolean" });
    }

    const updatedSlot = await Slots.findByIdAndUpdate(
      slotId,
      { $set: { completed } },  // Explicit $set operator
      { new: true, runValidators: true }  // Return updated doc and run validators
    );

    if (!updatedSlot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    const user = await UserCollection.findByIdAndUpdate(updatedSlot.userId,{status:completed?"completed":"scheduled"});
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      message: "Slot updated successfully",
      slot: updatedSlot
    });
    
  } catch (error) {
    console.error("Error updating slot status:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message 
    });
  }
};

