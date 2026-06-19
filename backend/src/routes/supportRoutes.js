import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import requireAuth from "../middleware/requireAuth.js";
import { sendEmail, emailConfig } from "../services/emailService.js";

const router = express.Router();

// Helper: Require Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

// Helper: Generate next ticket ID sequentially
const getNextTicketId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `SH-${currentYear}-`;
  
  // Find the latest ticket created in the current year
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

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
};

/* ==========================================================================
   POST /api/support/tickets - Submit a Support Ticket (Users only)
   ========================================================================== */
router.post("/tickets", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in clients can submit support tickets.",
      });
    }

    const { subject, description, category, priority, attachment } = req.body;

    // Validate required fields
    if (!subject || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "Subject, description, category, and priority are required.",
      });
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
      attachment: attachment || "",
    });

    // Send email to user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563EB;">Support Ticket Created</h2>
        <p>Dear ${req.user.name},</p>
        <p>Thank you for contacting ServiceHub. Your ticket has been received and is currently under review.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #666; font-size: 13px;">Our support team is reviewing your issue and will get back to you shortly (typically within 4-8 business hours).</p>
      </div>
    `;

    sendEmail({
      to: req.user.email,
      subject: `Support Ticket Received - ${ticketId}`,
      html: userEmailHtml,
      text: `Dear ${req.user.name},\n\nThank you for contacting ServiceHub. Your ticket has been received and is currently under review.\n\nTicket ID: ${ticketId}\nSubject: ${subject}\nCategory: ${category}\nPriority: ${priority}\n\nOur support team is reviewing your issue and will get back to you shortly (typically within 4-8 business hours).`,
    }).catch((err) => console.error("Error sending user ticket email:", err.message));

    // Send email to admin
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #8B5CF6;">New Support Ticket Alert</h2>
        <p>A new support ticket has been submitted on ServiceHub.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Created By:</strong> ${req.user.name} (${req.user.email})</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Description:</strong></p>
        <blockquote style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B5CF6; margin: 10px 0; font-style: italic;">
          ${description.replace(/\n/g, "<br/>")}
        </blockquote>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #666; font-size: 13px;">Please log in to the ServiceHub Admin Dashboard to manage and resolve this ticket.</p>
      </div>
    `;

    const adminEmail = emailConfig?.supportEmail || emailConfig?.fromEmail || "admin@servicehub.com";
    sendEmail({
      to: adminEmail,
      subject: `New Support Ticket - ${ticketId} [${priority}]`,
      html: adminEmailHtml,
      text: `A new support ticket has been submitted on ServiceHub.\n\nTicket ID: ${ticketId}\nCreated By: ${req.user.name} (${req.user.email})\nCategory: ${category}\nPriority: ${priority}\nSubject: ${subject}\nDescription:\n${description}`,
    }).catch((err) => console.error("Error sending admin ticket email:", err.message));

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
   GET /api/support/tickets/:ticketId - Get Ticket Details
   ========================================================================== */
router.get("/tickets/:ticketId", requireAuth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId }).lean();
    
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

    return res.json({ success: true, ticket });
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
   PATCH /api/support/tickets/:ticketId/status - Update Ticket Status (Admin only)
   ========================================================================== */
router.patch("/tickets/:ticketId/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["Open", "In Review", "Resolved", "Closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "A valid status (Open, In Review, Resolved, Closed) is required.",
      });
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    // Notify user of status update
    const userUpdateHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2563EB;">Support Ticket Status Updated</h2>
        <p>Dear ${ticket.userName},</p>
        <p>The status of your support ticket has been updated to <strong>${status}</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>New Status:</strong> ${status}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #666; font-size: 13px;">If you have any further questions, you can view the status of your ticket in the User Dashboard.</p>
      </div>
    `;

    sendEmail({
      to: ticket.userEmail,
      subject: `Support Ticket Status Updated - ${ticket.ticketId} [${status}]`,
      html: userUpdateHtml,
      text: `Dear ${ticket.userName},\n\nThe status of your support ticket has been updated to ${status}.\n\nTicket ID: ${ticket.ticketId}\nSubject: ${ticket.subject}\nNew Status: ${status}\n\nYou can view your ticket status in the User Dashboard.`,
    }).catch((err) => console.error("Error sending user status update email:", err.message));

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
