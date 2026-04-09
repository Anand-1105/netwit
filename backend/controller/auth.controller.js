import { User } from "../model/auth.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateTokenAndCookie } from "../utils/generateToken.js";
import { Events } from "../model/event.model.js";
import mongoose from "mongoose";

export const signup = async (req, res) => {
  const { username, email, password, role, eventId } = req.body;
  try {
    // Validation
    if (!username || !email || !password) {
     return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    if (role && !["manager", "viewer", "admin"].includes(role)) {
     return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Only authenticated admins can create admin accounts
    if (role === "admin") {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can create admin accounts",
        });
      }
    }

    // Check for existing users
    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username })
    ]);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "viewer", 
      lastLogin: new Date()
    });

    // If eventId is provided, add user to event's assignedTo
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error("Invalid event ID format");
      }

      const event = await Events.findById(eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Add user to event's assignedTo array if not already present
      if (!event.assignedTo.includes(newUser._id)) {
        event.assignedTo.push(newUser._id);
        await event.save();
      }
    }

    // Return response without sensitive data
    const { password: _, ...userWithoutPassword } = newUser._doc;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userWithoutPassword,
      eventAssigned: !!eventId // Indicates if user was assigned to an event
    });

  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message || "Registration failed" 
    });
  }
};

// export const verifyemail = async (req, res) => {
//   const { code } = req.body;

//   try {
//     const user = await User.findOne({
//       verificationToken: code,
//       verificationTokenExpiresAt: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or experied verification code",
//       });
//     }

//     user.isVerified = true;
//     user.verificationToken = undefined;
//     user.verificationTokenExpiresAt = undefined;
//     await user.save();

//     await sendWelcomeEmail(user.email, user.name);

//     res.status(200).json({
//       success: true,
//       message: "Email verified Successfully ",
//       user: {
//         ...user._doc,
//         password: undefined,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: `Failed to verify the  Email Account : ${error}`,
//     });
//   }
// };

export const login = async (req, res) => {
  
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    
    generateTokenAndCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in Successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Login Failes : ${error}`,
    });
  }
};
export const usersList = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const users = await User.find({}).select('username email role');
    if (!users) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Fetched in Successfully",
      users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Failes : ${error}`,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged-Out Successfully",
  });
};

// export const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User Not Found !!!",
//       });
//     }

//     const resetToken = crypto.randomBytes(20).toString("hex");
//     const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hrs

//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpiresAt = resetTokenExpiresAt;
//     await user.save();

//     await sendPasswordResetEmail(
//       user.email,
//       `${process.env.CLIENT_URL}/reset-password/${resetToken}`
//     );

//     res.status(200).json({
//       success: true,
//       message: "Password Reset Link Send ton your email",
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: `error in sending email : ${error}`,
//     });
//   }
// };

// export const resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpiresAt: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired token",
//       });
//     }

//     // update password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpiresAt = undefined;
//     user.save();

//     await sendResetSuccessEmail(user.email);

//     res.status(200).json({
//       success: true,
//       message: "Reset Successful Email send Successfully!!!",
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }
    const trimmed = username.trim();

    // Check if username is taken by someone else
    const existing = await User.findOne({ username: trimmed, _id: { $ne: req.userId } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const updated = await User.findByIdAndUpdate(
      req.userId,
      { username: trimmed },
      { new: true }
    ).select('-password');

    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_Token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    return res.status(200).json({ authenticated: true, user });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
};
