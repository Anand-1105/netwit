import jwt from "jsonwebtoken";
import { User } from "../model/auth.model.js";

export const protectRoute = async (req, res, next) => {
  let token;

  token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token,process.env.JWT_Token);
    

    req.userId = decoded.userId;
    req.user = await User.findById(decoded.userId);

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to check if the user is an admin
export const isAdmin = (req, res, next) => {
  // Check if the user is authenticated and has the "admin" role
  if (!req.user || !req.user.role.includes("admin")) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// export const isCitizen = (req, res, next) => {
//   // Check if the user is authenticated and has the "admin" role
//   if (!req.user || !req.user.role.includes("citizen")) {
//     return res.status(403).json({ message: "Access denied. Citizen only." });
//   }
//   next();
// };
