import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
   assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    createdBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
     slotGap: {
      type: Number,
      required:true
    },
     startDate: {
      type: Date,
      required:true
    },
    endDate:{
      type: Date,
      required:true
    }
  },
  { timestamps: true }
);

export const Events = mongoose.model("Event", eventSchema);

// Index for role-based event filtering
eventSchema.index({ assignedTo: 1 });
