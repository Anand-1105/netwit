import mongoose from "mongoose";
import { UserCollection } from "../model/filedata.model.js";
import { Events } from "../model/event.model.js";

// Escape special regex characters to prevent ReDoS
const escapeRegex = (s) => s.split("").map(c => "\.+*?^${}()|[]\\".indexOf(c) !== -1 ? "\\" + c : c).join("");

export const getStatusDistribution = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { timeRange } = req.query;

    // Calculate date ranges based on timeRange parameter
    let dateFilter = {};
    if (timeRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    }

    // Base match conditions
    const baseMatch = { ...dateFilter };
    if (eventId && eventId !== 'all') {
      baseMatch.event = new mongoose.Types.ObjectId(eventId);
    }

    const statusStats = await UserCollection.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$slots.completed", true] },
              "completed",
              "pending"
            ]
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);

    // Convert array to object format
    const result = {
      completed: 0,
      pending: 0
    };

    statusStats.forEach(stat => {
      if (stat.status === 'completed') {
        result.completed = stat.count;
      } else {
        result.pending = stat.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Status distribution error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const user = req.user
    const { timeRange, eventId } = req.query; // 'week', 'month', or undefined for all time
    if((user.role!=="admin")&&(!eventId)){
 return res.status(200).json({
      success: false,
      message:"Eventy id is required",
    })
    }
    // Calculate date ranges based on timeRange parameter
    let dateFilter = {};
    if (timeRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    }

    // Base match conditions - include event filter if eventId is provided
    const baseMatch = { ...dateFilter };
    if (eventId) {
      // Validate eventId to avoid invalid ObjectId errors
      const isValid = mongoose.Types.ObjectId.isValid(eventId);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid eventId",
        });
      }
      baseMatch.event = new mongoose.Types.ObjectId(eventId);
    }

    // 1. Get Overall Statistics
    const userStatsAgg = await UserCollection.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: 'slots',
          localField: '_id',
          foreignField: 'userId',
          as: 'slotData'
        }
      },
      { $unwind: { path: "$slotData", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                giftsCollected: {
                  $sum: { $cond: [{ $eq: ["$giftCollected", true] }, 1, 0] },
                },
                eventsCount: { $addToSet: "$event" },
              },
            },
            {
              $project: {
                _id: 0,
                totalUsers: 1,
                giftsCollected: 1,
                totalEvents: { $size: "$eventsCount" },
              },
            },
          ],
          status: [
            {
              $match: { "slotData": { $exists: true, $ne: null } }
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $eq: ["$slotData.completed", true] },
                    "completed",
                    "pending"
                  ]
                },
                count: { $sum: 1 }
              }
            },
            { $project: { _id: 0, k: "$_id", v: "$count" } },
            { $group: { _id: null, arr: { $push: { k: "$k", v: "$v" } } } },
            { $project: { _id: 0, statusSummary: { $arrayToObject: "$arr" } } },
          ],
        },
      },
      {
        $project: {
          totalUsers: { $ifNull: [{ $arrayElemAt: ["$totals.totalUsers", 0] }, 0] },
          totalEvents: { $ifNull: [{ $arrayElemAt: ["$totals.totalEvents", 0] }, 0] },
          giftsCollected: { $ifNull: [{ $arrayElemAt: ["$totals.giftsCollected", 0] }, 0] },
          statusSummary: {
            $ifNull: [{ $arrayElemAt: ["$status.statusSummary", 0] }, { completed: 0, pending: 0 }],
          },
        },
      },
    ]);
    
    const userStats = userStatsAgg[0] || {
      totalUsers: 0,
      totalEvents: 0,
      giftsCollected: 0,
      statusSummary: { completed: 0, pending: 0 },
    };

    // 3. Get Event-wise Distribution (only if no specific eventId was requested)
    let eventStats = [];
    if (!eventId) {
      eventStats = await UserCollection.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            as: "eventDetails"
          }
        },
        { $unwind: "$eventDetails" },
        {
          $group: {
            _id: "$eventDetails.title",
            count: { $sum: 1 },
            eventId: { $first: "$eventDetails._id" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
    } else {
      // If eventId is provided, get details for that specific event
      const eventDetails = mongoose.Types.ObjectId.isValid(eventId)
        ? await Events.findById(eventId)
        : null;
      if (eventDetails) {
        eventStats = [{
          _id: eventDetails.title,
          count: userStats?.totalUsers || 0,
          eventId: eventDetails._id
        }];
      }
    }

    // 6. Response Structure
    const dashboardData = {
      statistics: {
        totalUsers: userStats?.totalUsers || 0,
        totalEvents: userStats?.totalEvents || 0,
        giftsCollected: userStats?.giftsCollected || 0,
        statusDistribution: userStats?.statusSummary || { completed: 0, pending: 0 },
      },
      timeRange: timeRange || 'all',
      eventFilter: eventId || 'all'
    };

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};


// Get unique companies for an event
export const getEventCompanies = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    const companies = await UserCollection.findOne({ event: new mongoose.Types.ObjectId(eventId) }, { selectedBy: 1 });
    if (!companies) {
      return res.status(200).json({ success: true, data: [] });
    }
    const companyNames = (companies.selectedBy || []).map(company => company.name);
    return res.status(200).json({
      success: true,
      data: companyNames
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// Get unique time slots for an event
export const getEventSlots = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    const slots = await UserCollection.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      { $lookup: { from: "slots", localField: "_id", foreignField: "userId", as: "slots" } },
      { $unwind: "$slots" },
      { $group: { _id: "$slots.timeSlot" } },
      { $project: { _id: 0, timeSlot: "$_id" } },
      { $sort: { timeSlot: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: slots.map(s => s.timeSlot).filter(Boolean)
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const getUsersListCompanywise = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { company,search, slot, status, sortBy = 'desc', page = 1, limit = 10 } = req.body;
    const skip = (page - 1) * limit;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    // Build the base pipeline
    const pipeline = [
      // Match by event first for better performance
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      
      // Lookup slots
      {
        $lookup: {
          from: "slots",
          localField: "_id",
          foreignField: "userId",
          as: "slots"
        }
      },
      { $unwind: "$slots" },
      
      // Apply filters
      {
        $match: {
          ...(status && { 'slots.completed':status=="completed" }),
          ...(company && { 'slots.company': company }),
          ...(slot && { 'slots.timeSlot': slot }),
          ...(search && { $or: [
          ] })
        }
      },
      
      // Sort
      { $sort: { createdAt: sortBy === "asc" ? 1 : -1 } },
      
      // Project only needed fields
      {
        $project: {
          _id: {
            $toString: {
              $concat: [
                { $ifNull: [{ $toString: "$_id" }, ""] },
                "_",
                { $toString: { $floor: { $multiply: [1000, { $rand: {} }] } } }
              ]
            }
          },
          firstName: 1,
          lastName: 1,
          email: 1,
          createdAt: 1,
          'slots.timeSlot': 1,
          'slots.completed': 1,
          'slots.company': 1,
          'slots._id': 1
        }
      }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await UserCollection.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination to the main pipeline
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const data = await UserCollection.aggregate(pipeline);

    return res.status(200).json({ 
      success: true, 
      users: data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching users list:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

        

