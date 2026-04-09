import express, { urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// All connections here
import connectDb from "./lib/db.js";

// All routes here
import fileRoutes from "./routes/file.routes.js";
import eventRoutes from "./routes/event.route.js";
import authRoutes from "./routes/auth.routes.js";
import slotRoutes from "./routes/slot.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import userRoutes from "./routes/user.routes.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8493;
// CORS Configuration (Apply this before routes)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://meeting-app-beta-seven.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://idc.loopnow.in"
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
};

// Apply CORS middleware with the above options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security headers
app.use(helmet());

// Rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: "Too many requests, please try again later." } });
const otpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, message: "Too many OTP requests, please try again in an hour." } });

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// All routes here
app.use("/api/auth/login", authLimiter);
app.use("/api/otp", otpLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/events",eventRoutes); 
app.use("/api", slotRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/users", userRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// app.use("/api/admin", adminRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDb();
});
