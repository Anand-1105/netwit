import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 50000, // Increase timeout for initial connection
      socketTimeoutMS: 45000, // Increase socket timeout
      connectTimeoutMS: 50000, // Increase connection timeout
    });

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;