import Otp from "../model/otp.model.js";
import { User } from "../model/auth.model.js";
import bcrypt from "bcrypt";
import { sendEmail, otpHtml } from "../lib/email.js";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    await Otp.deleteMany({ email });

    const otp = generateOtp();
    await Otp.create({ email, otp });

    await sendEmail(email, "Your MeetApp OTP", otpHtml(otp));

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again later." });
  }
};

export const setPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ error: "All fields required" });

    const otpDoc = await Otp.findOne({ email, otp });
    if (!otpDoc) return res.status(400).json({ error: "Invalid or expired OTP" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    await Otp.deleteMany({ email });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error setting password:", error);
    res.status(500).json({ error: "Failed to set password. Please try again later." });
  }
};
