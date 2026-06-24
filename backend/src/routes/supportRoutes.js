import express from "express";
import rateLimit from "express-rate-limit";
import SupportTicket from "../models/SupportTicket.js";
import TicketMessage from "../models/TicketMessage.js";
import User from "../models/User.js";
import requireAuth from "../middleware/requireAuth.js";
import { sendEmail, emailConfig } from "../services/emailService.js";

const router = express.Router();

// Helper: Require Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

// Rate limiter for ticket creation (max 5 tickets per 15 minutes per user)
const ticketCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 ticket creations per window
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: "Too many tickets created. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: Validate file format and size (< 5MB)
const validateAttachment = (attachment) => {
  if (!attachment || !attachment.url) return true;
  const { url, name } = attachment;

  // Check base64 format and allowed mime types: image (png, jpeg, webp), pdf, word documents (doc, docx), text (txt)
  const mimeRegex = /^data:(image\/(png|jpe?g|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain);base64,/;
  if (!mimeRegex.test(url)) {
    throw new Error(`File type not supported for "${name}". Only Images, PDFs, Word documents, and Text files are allowed.`);
  }

  // Calculate approximate size
  const base64Data = url.split(",")[1];
  if (!base64Data) {
    throw new Error(`Invalid file content for "${name}".`);
  }
  const sizeInBytes = Math.round((base64Data.length * 3) / 4);
  if (sizeInBytes > 5 * 1024 * 1024) {
    throw new Error(`File size for "${name}" exceeds the 5MB limit.`);
  }
  return true;
};

// Helper: Generate next ticket ID sequentially
const getNextTicketId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `SH-${currentYear}-`;

  const latestTicket = await SupportTicket.findOne({
    ticketId: { $regex: new RegExp(`^${prefix}`) },
  })
    .sort({ createdAt: -1 })
    .lean();

  let nextNumber = 1;
  if (latestTicket) {
    const lastId = latestTicket.ticketId;
    const parts = lastId.split("-");
    const numPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(numPart)) {
      nextNumber = numPart + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// Helper: Send ticket emails styled with ServiceHub colors
const sendSupportEmail = async (ticket, subject, htmlBody) => {
  const userEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #1e293b; border-radius: 16px; background-color: #0b0f19; color: #f1f5f9;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; background: linear-gradient(to right, #6366f1, #d946ef, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #6366f1; letter-spacing: 0.05em;">ServiceHub Support</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Dear ${ticket.userName || "Customer"},</p>
      <div style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
        ${htmlBody}
      </div>
      <div style="background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="margin-top: 0; margin-bottom: 12px; color: #f43f5e; font-size: 14px; text-transform: uppercase; tracking: 0.05em;">Ticket Summary</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #94a3b8; width: 120px;"><strong>Ticket ID:</strong></td>
            <td style="padding: 4px 0; color: #f1f5f9;">${ticket.ticketId}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;"><strong>Subject:</strong></td>
            <td style="padding: 4px 0; color: #f1f5f9;">${ticket.subject}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;"><strong>Category:</strong></td>
            <td style="padding: 4px 0; color: #f1f5f9;">${ticket.category}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;"><strong>Priority:</strong></td>
            <td style="padding: 4px 0; color: #f1f5f9;">
              <span style="padding: 2px 8px; border-radius: 4px; font-weight: bold; background-color: ${
                ticket.priority === "Urgent" ? "#ef444425" : ticket.priority === "High" ? "#f9731625" : "#3b82f625"
              }; color: ${
                ticket.priority === "Urgent" ? "#ef4444" : ticket.priority === "High" ? "#f97316" : "#3b82f6"
              }; font-size: 12px;">${ticket.priority}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;"><strong>Status:</strong></td>
            <td style="padding: 4px 0; color: #f1f5f9;">${ticket.status}</td>
          </tr>
        </table>
      </div>
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px; text-align: center; margin-bottom: 0;">This is an automated notification from ServiceHub Help & Support. Please do not reply directly to this email.</p>
    </div>
  `;
  
  return sendEmail({
    to: ticket.userEmail,
    subject,
    html: userEmailHtml,
    text: `Support Notification: ${subject}\n\nTicket ID: ${ticket.ticketId}\nSubject: ${ticket.subject}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\n\nThank you,\nServiceHub Support Team`,
  }).catch((err) => console.error("Error sending support email:", err.message));
};

/* ==========================================================================
   POST /api/support/tickets - Submit a Support Ticket (Users only)
   ========================================================================== */
router.post("/tickets", requireAuth, ticketCreationLimiter, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in clients can submit support tickets.",
      });
    }

    const { subject, description, category, priority, attachments, bookingId } = req.body;

    // Validate required fields
    if (!subject || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "Subject, description, category, and priority are required.",
      });
    }

    // Validate attachments
    if (attachments && Array.isArray(attachments)) {
      for (const file of attachments) {
        try {
          validateAttachment(file);
        } catch (error) {
          return res.status(400).json({ success: false, message: error.message });
        }
      }
    }

    // Generate unique sequential ticket ID
    const ticketId = await getNextTicketId();

    // Create the ticket
    const ticket = await SupportTicket.create({
      ticketId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      attachments: attachments || [],
      bookingId: bookingId || "",
    });

    // Send email to user (Brevo)
    await sendSupportEmail(
      ticket,
      `Support Ticket Created - ${ticketId}`,
      `<p>Thank you for contacting ServiceHub.</p><p>Your support ticket <strong>${ticketId}</strong> has been created successfully and is currently under review by our operations desk.</p>`
    );

    // Send email to admin
    const adminEmail = emailConfig?.supportEmail || emailConfig?.fromEmail || "admin@servicehub.com";
    const adminEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; color: #333333;">
        <h2 style="color: #4f46e5; margin-top: 0;">New Helpdesk Ticket Alert</h2>
        <p>A new support ticket has been filed on ServiceHub.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Created By:</strong> ${req.user.name} (${req.user.email})</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Description:</strong></p>
        <blockquote style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #6366f1; margin: 15px 0; font-style: italic; border-radius: 4px; white-space: pre-wrap;">${description}</blockquote>
        ${bookingId ? `<p><strong>Linked Booking ID:</strong> ${bookingId}</p>` : ""}
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 13px;">Please log in to the Admin Dashboard to manage and assign this ticket.</p>
      </div>
    `;
    sendEmail({
      to: adminEmail,
      subject: `New Helpdesk Ticket - ${ticketId} [${priority}]`,
      html: adminEmailHtml,
      text: `A new support ticket has been submitted on ServiceHub.\n\nTicket ID: ${ticketId}\nCreated By: ${req.user.name} (${req.user.email})\nCategory: ${category}\nPriority: ${priority}\nSubject: ${subject}\nDescription:\n${description}`,
    }).catch((err) => console.error("Error sending admin ticket alert email:", err.message));

    return res.status(201).json({
      success: true,
      ticketId,
      message: "Ticket created successfully.",
      data: ticket,
    });
  } catch (error) {
    console.error("Ticket Submission Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Ticket could not be submitted. Please try again later.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   GET /api/support/tickets - List Support Tickets (Admin and User)
   ========================================================================== */
router.get("/tickets", requireAuth, async (req, res) => {
  try {
    const { role } = req.user;

    if (role === "admin") {
      // Admin query filters
      const { status, category, priority, search } = req.query;
      const query = {};

      if (status && status !== "All") {
        query.status = status;
      }
      if (category && category !== "All") {
        query.category = category;
      }
      if (priority && priority !== "All") {
        query.priority = priority;
      }
      if (search && search.trim() !== "") {
        const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        query.$or = [
          { ticketId: { $regex: escapedSearch, $options: "i" } },
          { subject: { $regex: escapedSearch, $options: "i" } },
          { userName: { $regex: escapedSearch, $options: "i" } },
          { userEmail: { $regex: escapedSearch, $options: "i" } },
        ];
      }

      const tickets = await SupportTicket.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, tickets });
    } else {
      // Regular user gets only their own tickets
      const tickets = await SupportTicket.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, tickets });
    }
  } catch (error) {
    console.error("List Tickets Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve support tickets.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   GET /api/support/analytics - Get Admin Ticket Analytics (Admin only)
   ========================================================================== */
router.get("/analytics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [summary = {}] = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Open", "Assigned", "In Progress", "Waiting for Customer"]] },
                1,
                0,
              ],
            },
          },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          highPriority: {
            $sum: { $cond: [{ $in: ["$priority", ["High", "Urgent"]] }, 1, 0] },
          },
          avgResolutionMs: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", ["Resolved", "Closed"]] },
                    { $ne: ["$resolvedAt", null] },
                    { $gt: ["$resolvedAt", "$createdAt"] },
                  ],
                },
                { $subtract: ["$resolvedAt", "$createdAt"] },
                null,
              ],
            },
          },
        },
      },
    ]);

    const averageHours = Number(summary.avgResolutionMs || 0) / (1000 * 60 * 60);
    const avgResolutionTime = !summary.avgResolutionMs
      ? "N/A"
      : averageHours < 1
        ? `${Math.round(averageHours * 60)}m`
        : `${averageHours.toFixed(1)}h`;

    return res.json({
      success: true,
      stats: {
        total: summary.total || 0,
        open: summary.open || 0,
        resolved: summary.resolved || 0,
        highPriority: summary.highPriority || 0,
        avgResolutionTime,
      },
    });
  } catch (error) {
    console.error("Support Analytics Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not compile support analytics.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   GET /api/support/staff - Get Admin Staff list for assignment (Admin only)
   ========================================================================== */
router.get("/staff", requireAuth, requireAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: "admin" }, "_id name email").sort({ name: 1 }).lean();
    return res.json({ success: true, staff });
  } catch (error) {
    console.error("Support Staff Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load administrative staff.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   GET /api/support/tickets/:ticketId - Get Ticket Details + Conversation History
   ========================================================================== */
router.get("/tickets/:ticketId", requireAuth, async (req, res) => {
  try {
    const messageQuery = { ticketId: req.params.ticketId };
    if (req.user.role !== "admin") {
      messageQuery.senderRole = { $ne: "internal" };
    }

    const [ticket, messages] = await Promise.all([
      SupportTicket.findOne({ ticketId: req.params.ticketId }).lean(),
      TicketMessage.find(messageQuery)
        .sort({ createdAt: 1 })
        .populate("senderId", "name email profileImage role")
        .lean(),
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Verify ownership or admin access
    if (req.user.role !== "admin" && String(ticket.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this ticket.",
      });
    }

    return res.json({ success: true, ticket, messages });
  } catch (error) {
    console.error("Get Ticket Details Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve support ticket details.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   POST /api/support/tickets/:ticketId/messages - Reply to a Ticket
   ========================================================================== */
router.post("/tickets/:ticketId/messages", requireAuth, async (req, res) => {
  try {
    const { message, attachment, isInternal } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be blank.",
      });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Verify access
    if (req.user.role !== "admin" && String(ticket.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to message on this ticket.",
      });
    }

    // Validate attachment if present
    if (attachment) {
      try {
        validateAttachment(attachment);
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }

    // Set role
    let senderRole = req.user.role === "admin" ? "admin" : "user";
    if (req.user.role === "admin" && isInternal) {
      senderRole = "internal";
    }

    // Create message
    const newMessage = await TicketMessage.create({
      ticketId: ticket.ticketId,
      senderId: req.user._id,
      senderRole,
      message: message.trim(),
      attachment: attachment || { name: "", url: "" },
    });

    // Populate sender fields for response
    const populatedMessage = await TicketMessage.findById(newMessage._id)
      .populate("senderId", "name email profileImage role")
      .lean();

    // Auto-update ticket status
    if (req.user.role === "user") {
      // Reopen or transition status back to Open/In Progress if client responds
      if (["Resolved", "Closed"].includes(ticket.status)) {
        ticket.status = "Open";
      }
    }
    
    ticket.updatedAt = new Date();
    await ticket.save();

    // Send email notification on admin reply (exclude internal notes)
    if (req.user.role === "admin" && senderRole !== "internal") {
      await sendSupportEmail(
        ticket,
        `New Reply to Your Support Ticket - ${ticket.ticketId}`,
        `<p>A member of our support team has responded to your ticket <strong>${ticket.ticketId}</strong>:</p>
         <blockquote style="background-color: #111827; border-left: 4px solid #f43f5e; color: #f1f5f9; padding: 15px; margin: 15px 0; border-radius: 4px; white-space: pre-wrap; font-style: italic;">${message.trim()}</blockquote>
         <p>Please log in to your Help & Support Center dashboard to reply.</p>`
      );
    }

    return res.status(201).json({
      success: true,
      message: "Reply added successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Add Reply Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not send reply. Please try again later.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   PATCH /api/support/tickets/:ticketId/assign - Assign Ticket (Admin only)
   ========================================================================== */
router.patch("/tickets/:ticketId/assign", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "assignedTo staff member ID is required.",
      });
    }

    const staffUser = await User.findOne({ _id: assignedTo, role: "admin" }).lean();
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: "Administrative staff member not found.",
      });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    ticket.assignedTo = staffUser._id;
    if (ticket.status === "Open") {
      ticket.status = "Assigned";
    }
    ticket.updatedAt = new Date();
    await ticket.save();

    // Send email notification (Ticket Assigned)
    await sendSupportEmail(
      ticket,
      `Support Ticket Assigned - ${ticket.ticketId}`,
      `<p>An agent has taken ownership of your support ticket <strong>${ticket.ticketId}</strong>.</p>
       <p>Your ticket is now assigned to <strong>${staffUser.name}</strong>, who will be investigating your request and contacting you shortly.</p>`
    );

    return res.json({
      success: true,
      message: `Ticket successfully assigned to ${staffUser.name}.`,
      data: ticket,
    });
  } catch (error) {
    console.error("Assign Ticket Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not assign ticket.",
      error: error.message,
    });
  }
});

/* ==========================================================================
   PATCH /api/support/tickets/:ticketId/status - Update Ticket Status (Admin only)
   ========================================================================== */
router.patch("/tickets/:ticketId/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "Open",
      "Assigned",
      "In Progress",
      "Waiting for Customer",
      "Resolved",
      "Closed",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `A valid status is required: ${allowedStatuses.join(", ")}`,
      });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date();

    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    // Send email notification of status transition
    if (status === "Resolved") {
      await sendSupportEmail(
        ticket,
        `Your Ticket ${ticket.ticketId} Has Been Resolved`,
        `<p>Your support ticket <strong>${ticket.ticketId}</strong> has been resolved by our support staff.</p>
         <p>If the issue is fully addressed, no further actions are required. If you feel this resolution is incomplete or if you have follow-up questions, simply post a reply on the ticket thread to automatically reopen it.</p>`
      );
    } else if (status === "Closed") {
      await sendSupportEmail(
        ticket,
        `Your Ticket ${ticket.ticketId} Has Been Closed`,
        `<p>Your support ticket <strong>${ticket.ticketId}</strong> has been closed.</p>
         <p>If you have any further questions or new issues, please create a new support ticket.</p>`
      );
    } else {
      await sendSupportEmail(
        ticket,
        `Support Ticket Status Updated - ${ticket.ticketId}`,
        `<p>The status of your support ticket <strong>${ticket.ticketId}</strong> has been updated from <strong>${oldStatus}</strong> to <strong>${status}</strong>.</p>`
      );
    }

    return res.json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      data: ticket,
    });
  } catch (error) {
    console.error("Update Ticket Status Route Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update support ticket status.",
      error: error.message,
    });
  }
});

export default router;
