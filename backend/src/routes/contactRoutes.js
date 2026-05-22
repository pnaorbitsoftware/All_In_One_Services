import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();





/* =====================================
   CREATE CONTACT MESSAGE
===================================== */

router.post("/", async (req, res) => {
  console.log("CONTACT API HIT");

  try {
    console.log("Request Body:", req.body);

    const { name, email, message } = req.body;





    /* VALIDATION */

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, and message are required.",
      });
    }





    /* EMAIL VALIDATION */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }





    /* SAVE TO DATABASE */

    const contactMessage =
      await ContactMessage.create({
        name,
        email,
        message,
      });

    console.log(
      "Saved Successfully:",
      contactMessage
    );





    /* SUCCESS RESPONSE */

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