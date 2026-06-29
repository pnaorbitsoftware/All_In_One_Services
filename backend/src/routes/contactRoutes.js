import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, and message are required.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    const contactMessage =
      await ContactMessage.create({
        name,
        email,
        message,
      });

    return res.status(201).json({
      success: true,
      message: "Message saved successfully.",
      data: contactMessage,
    });
  } catch (error) {
    console.error(
      "Contact Route Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Message could not be saved. Please try again later.",
      error: error.message,
    });
  }
});

export default router;
