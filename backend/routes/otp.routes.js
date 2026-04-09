import express from "express";
import { sendOtp, setPassword } from "../controller/otp.controller.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/set-password", setPassword);

export default router;
