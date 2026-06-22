import express from "express";
import rateLimit from "express-rate-limit";

import Notification from "../models/Notification.js";
import SupportCounter from "../models/SupportCounter.js";
import SupportFaq from "../models/SupportFaq.js";
import SupportTicket from "../models/SupportTicket.js";
import TicketMessage from "../models/TicketMessage.js";
import User from "../models/User.js";
import requireAuth from "../middleware/requireAuth.js";
import { sendEmail, emailConfig } from "../services/emailService.js";

const router = express.Router();

const categories = ["Technical Issue", "Payment Issue", "Service Issue", "Account Issue", "Other"];
const priorities = ["Low", "Medium", "High"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];
const adminEmail = emailConfig?.supportEmail || emailConfig?.fromEmail || "admin@servicehub.com";

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizePage = (value, fallback = 1) => Math.max(Number.parseInt(value, 10) || fallback, 1);
const normalizeLimit = (value) => Math.min(Math.max(Number.parseInt(value, 10) || 10, 1), 100);

const ticketCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: "Too many tickets created. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const validateAttachment = (attachment) => {
  if (!attachment || !attachment.url) return true;
  const { url, name = "attachment" } = attachment;
  const mimeRegex = /^data:(image\/(png|jpe?g|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain);base64,/;

  if (!mimeRegex.test(url)) {
    throw new Error(`File type not supported for "${name}". Only images, PDFs, Word documents, and text files are allowed.`);
  }

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

const getNextTicketId = async () => {
  try {
    await SupportCounter.updateOne(
      { key: "supportTicket" },
      { $setOnInsert: { key: "supportTicket", sequence: 100000 } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const counter = await SupportCounter.findOneAndUpdate(
    { key: "supportTicket" },
    { $inc: { sequence: 1 } },
    { new: true }
  ).lean();

  return `TKT-${counter.sequence}`;
};

const createNotification = async ({ userId, role, title, message, ticketId }) => {
  if (!userId || !role) return null;

  const notification = await Notification.create({
    userId,
    role,
    title,
    message,
    type: "support",
    ticketId,
  });

  const serverKey = process.env.FCM_SERVER_KEY;
  if (serverKey) {
    User.findById(userId)
      .select("fcmToken")
      .lean()
      .then((user) => {
        if (!user?.fcmToken) return null;
        return fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${serverKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: user.fcmToken,
            notification: { title, body: message },
            data: { type: "support", ticketId: ticketId || "" },
          }),
        });
      })
      .catch(() => {});
  }

  return notification;
};

const notifyAdmins = async ({ title, message, ticketId }) => {
  const admins = await User.find({ role: "admin" }).select("_id role").lean();
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin._id,
        role: "admin",
        title,
        message,
        ticketId,
      })
    )
  );
};

const sendSupportEmail = async (ticket, subject, htmlBody) => {
  if (!ticket.userEmail) return { skipped: true };

  return sendEmail({
    to: ticket.userEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#172033">
        <h2 style="color:#2563eb">ServiceHub Help & Support</h2>
        <p>Hi ${escapeHtml(ticket.userName || "Customer")},</p>
        ${htmlBody}
        <div style="margin:20px 0;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0">
          <p><strong>Ticket:</strong> ${escapeHtml(ticket.ticketId)}</p>
          <p><strong>Category:</strong> ${escapeHtml(ticket.category)}</p>
          <p><strong>Priority:</strong> ${escapeHtml(ticket.priority)}</p>
          <p><strong>Status:</strong> ${escapeHtml(ticket.status)}</p>
        </div>
        <p style="font-size:12px;color:#64748b">This notification was sent by ServiceHub Help & Support.</p>
      </div>
    `,
    text: `ServiceHub Help & Support\n\n${subject}\nTicket: ${ticket.ticketId}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}`,
  }).catch((error) => ({ sent: false, reason: error.message }));
};

const serializeTicket = (ticket) => ({
  ...ticket,
  ticketNumber: ticket.ticketNumber || ticket.ticketId,
  requesterRole: ticket.role,
});

router.get("/faqs", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = { isActive: true };

    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");
      query.$or = [{ question: regex }, { answer: regex }, { category: regex }];
    }

    const faqs = await SupportFaq.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: "FAQs could not be loaded." });
  }
});

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, notifications });
  } catch {
    res.status(500).json({ success: false, message: "Notifications could not be loaded." });
  }
});

router.post("/tickets", requireAuth, ticketCreationLimiter, async (req, res) => {
  try {
    if (!["user", "provider"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only users and providers can submit support tickets." });
    }

    const category = String(req.body?.category || "").trim();
    const priority = String(req.body?.priority || "").trim();
    const description = String(req.body?.description || "").trim();
    const subject = String(req.body?.subject || `${category || "Support"} request`).trim();
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    const bookingId = String(req.body?.bookingId || "").trim();

    if (!categories.includes(category)) {
      return res.status(400).json({ success: false, message: `Issue Category must be one of: ${categories.join(", ")}.` });
    }

    if (!priorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Priority must be one of: ${priorities.join(", ")}.` });
    }

    if (!description || description.length < 10 || description.length > 500) {
      return res.status(400).json({ success: false, message: "Issue Description must be between 10 and 500 characters." });
    }

    for (const attachment of attachments) validateAttachment(attachment);

    const ticketId = await getNextTicketId();
    const ticket = await SupportTicket.create({
      ticketId,
      ticketNumber: ticketId,
      userId: req.user._id,
      role: req.user.role,
      userName: req.user.name,
      userEmail: req.user.email,
      userPhone: req.user.phone || "",
      subject,
      description,
      category,
      priority,
      status: "Open",
      attachments,
      bookingId,
    });

    await createNotification({
      userId: req.user._id,
      role: req.user.role,
      title: "Support ticket created",
      message: `${ticketId} was created successfully.`,
      ticketId,
    });

    await notifyAdmins({
      title: "New support ticket",
      message: `${ticketId} was created by ${req.user.name} (${req.user.role}).`,
      ticketId,
    });

    sendSupportEmail(
      ticket,
      `Support Ticket Created - ${ticketId}`,
      `<p>Your support ticket <strong>${escapeHtml(ticketId)}</strong> has been created and is currently open.</p>`
    );

    sendEmail({
      to: adminEmail,
      subject: `New Support Ticket - ${ticketId} [${priority}]`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#172033">
          <h2>New Support Ticket</h2>
          <p><strong>Ticket:</strong> ${escapeHtml(ticketId)}</p>
          <p><strong>Requester:</strong> ${escapeHtml(req.user.name)} (${escapeHtml(req.user.role)})</p>
          <p><strong>Email:</strong> ${escapeHtml(req.user.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(req.user.phone || "-")}</p>
          <p><strong>Category:</strong> ${escapeHtml(category)}</p>
          <p><strong>Priority:</strong> ${escapeHtml(priority)}</p>
          <p><strong>Description:</strong></p>
          <blockquote style="white-space:pre-wrap;background:#f8fafc;border-left:4px solid #2563eb;padding:12px">${escapeHtml(description)}</blockquote>
        </div>
      `,
      text: `New Support Ticket ${ticketId}\n${req.user.name} (${req.user.role})\n${category} / ${priority}\n${description}`,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      ticketId,
      message: "Ticket created successfully.",
      data: serializeTicket(ticket.toObject()),
    });
  } catch (error) {
    console.error("Ticket Submission Route Error:", error);
    res.status(500).json({ success: false, message: "Ticket could not be submitted. Please try again later." });
  }
});

const buildTicketQuery = (req) => {
  const query = {};
  const { status, category, priority, role, search } = req.query;

  if (status && status !== "All") query.status = status;
  if (category && category !== "All") query.category = category;
  if (priority && priority !== "All") query.priority = priority;
  if (role && role !== "All") query.role = String(role).toLowerCase();

  if (search && String(search).trim()) {
    const regex = new RegExp(escapeRegExp(String(search).trim()), "i");
    query.$or = [
      { ticketId: regex },
      { ticketNumber: regex },
      { subject: regex },
      { description: regex },
      { userName: regex },
      { userEmail: regex },
      { userPhone: regex },
    ];
  }

  return query;
};

const listTicketsHandler = async (req, res) => {
  try {
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const skip = (page - 1) * limit;
    const sortBy = ["createdAt", "updatedAt", "priority", "status", "category"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const query = req.user.role === "admin" ? buildTicketQuery(req) : { userId: req.user._id };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      tickets: tickets.map(serializeTicket),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error("List Tickets Route Error:", error);
    res.status(500).json({ success: false, message: "Could not retrieve support tickets." });
  }
};

router.get("/tickets", requireAuth, listTicketsHandler);

router.get("/admin/tickets", requireAuth, requireAdmin, listTicketsHandler);

router.get("/analytics", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: "Open" }),
      SupportTicket.countDocuments({ status: "In Progress" }),
      SupportTicket.countDocuments({ status: "Resolved" }),
      SupportTicket.countDocuments({ status: "Closed" }),
    ]);

    res.json({
      success: true,
      stats: { total, open, inProgress, resolved, closed },
    });
  } catch {
    res.status(500).json({ success: false, message: "Could not compile support analytics." });
  }
});

router.get("/staff", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const staff = await User.find({ role: "admin" }, "_id name email").sort({ name: 1 }).lean();
    res.json({ success: true, staff });
  } catch {
    res.status(500).json({ success: false, message: "Could not load administrative staff." });
  }
});

router.get("/tickets/:ticketId", requireAuth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId }).lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    if (req.user.role !== "admin" && String(ticket.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this ticket." });
    }

    const messageQuery = { ticketId: req.params.ticketId };
    if (req.user.role !== "admin") messageQuery.senderRole = { $ne: "internal" };

    const messages = await TicketMessage.find(messageQuery)
      .sort({ createdAt: 1 })
      .populate("senderId", "name email profileImage role")
      .lean();

    res.json({ success: true, ticket: serializeTicket(ticket), messages });
  } catch {
    res.status(500).json({ success: false, message: "Could not retrieve support ticket details." });
  }
});

router.post("/tickets/:ticketId/messages", requireAuth, async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    const { attachment, isInternal } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message content cannot be blank." });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: "Message cannot exceed 1000 characters." });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    if (req.user.role !== "admin" && String(ticket.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to message on this ticket." });
    }

    if (attachment) validateAttachment(attachment);

    const senderRole = req.user.role === "admin" && isInternal ? "internal" : req.user.role;
    const newMessage = await TicketMessage.create({
      ticketId: ticket.ticketId,
      senderId: req.user._id,
      senderRole,
      message,
      attachment: attachment || { name: "", url: "" },
    });

    if (req.user.role === "admin" && senderRole !== "internal") {
      ticket.adminResponse = message;
      ticket.adminRespondedAt = new Date();
      ticket.adminRespondedBy = req.user._id;
      if (ticket.status === "Open") ticket.status = "In Progress";

      await createNotification({
        userId: ticket.userId,
        role: ticket.role,
        title: "Support replied",
        message: `Admin responded to ${ticket.ticketId}.`,
        ticketId: ticket.ticketId,
      });

      sendSupportEmail(
        ticket,
        `New Reply to Your Support Ticket - ${ticket.ticketId}`,
        `<p>A support admin replied to ticket <strong>${escapeHtml(ticket.ticketId)}</strong>:</p><blockquote style="white-space:pre-wrap;background:#f8fafc;border-left:4px solid #2563eb;padding:12px">${escapeHtml(message)}</blockquote>`
      );
    }

    if (["user", "provider"].includes(req.user.role) && ticket.status === "Resolved") {
      ticket.status = "Open";
    }

    await ticket.save();

    const populatedMessage = await TicketMessage.findById(newMessage._id)
      .populate("senderId", "name email profileImage role")
      .lean();

    res.status(201).json({ success: true, message: "Reply added successfully.", data: populatedMessage });
  } catch (error) {
    console.error("Add Reply Route Error:", error);
    res.status(500).json({ success: false, message: "Could not send reply. Please try again later." });
  }
});

router.patch("/tickets/:ticketId/response", requireAuth, requireAdmin, async (req, res) => {
  try {
    const response = String(req.body?.response || req.body?.adminResponse || req.body?.message || "").trim();
    if (!response) {
      return res.status(400).json({ success: false, message: "Admin response is required." });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    ticket.adminResponse = response;
    ticket.adminRespondedAt = new Date();
    ticket.adminRespondedBy = req.user._id;
    if (ticket.status === "Open") ticket.status = "In Progress";
    await ticket.save();

    const message = await TicketMessage.create({
      ticketId: ticket.ticketId,
      senderId: req.user._id,
      senderRole: "admin",
      message: response,
      attachment: { name: "", url: "" },
    });

    const populatedMessage = await TicketMessage.findById(message._id)
      .populate("senderId", "name email profileImage role")
      .lean();

    await createNotification({
      userId: ticket.userId,
      role: ticket.role,
      title: "Support replied",
      message: `Admin responded to ${ticket.ticketId}.`,
      ticketId: ticket.ticketId,
    });

    sendSupportEmail(
      ticket,
      `New Reply to Your Support Ticket - ${ticket.ticketId}`,
      `<p>A support admin replied to ticket <strong>${escapeHtml(ticket.ticketId)}</strong>:</p><blockquote style="white-space:pre-wrap;background:#f8fafc;border-left:4px solid #2563eb;padding:12px">${escapeHtml(response)}</blockquote>`
    );

    res.json({ success: true, message: "Admin response sent.", data: serializeTicket(ticket.toObject()), threadMessage: populatedMessage });
  } catch {
    res.status(500).json({ success: false, message: "Could not save admin response." });
  }
});

router.patch("/tickets/:ticketId/assign", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ success: false, message: "assignedTo staff member ID is required." });
    }

    const staffUser = await User.findOne({ _id: assignedTo, role: "admin" }).lean();
    if (!staffUser) {
      return res.status(404).json({ success: false, message: "Administrative staff member not found." });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    ticket.assignedTo = staffUser._id;
    if (ticket.status === "Open") ticket.status = "In Progress";
    await ticket.save();

    res.json({ success: true, message: `Ticket successfully assigned to ${staffUser.name}.`, data: serializeTicket(ticket.toObject()) });
  } catch {
    res.status(500).json({ success: false, message: "Could not assign ticket." });
  }
});

router.patch("/tickets/:ticketId/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || "").trim();
    if (!statuses.includes(status)) {
      return res.status(400).json({ success: false, message: `A valid status is required: ${statuses.join(", ")}.` });
    }

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.resolvedAt = status === "Resolved" || status === "Closed" ? new Date() : null;
    await ticket.save();

    await createNotification({
      userId: ticket.userId,
      role: ticket.role,
      title: "Support ticket updated",
      message: `${ticket.ticketId} changed from ${oldStatus} to ${status}.`,
      ticketId: ticket.ticketId,
    });

    sendSupportEmail(
      ticket,
      `Support Ticket Status Updated - ${ticket.ticketId}`,
      `<p>Your support ticket <strong>${escapeHtml(ticket.ticketId)}</strong> status changed from <strong>${escapeHtml(oldStatus)}</strong> to <strong>${escapeHtml(status)}</strong>.</p>`
    );

    res.json({ success: true, message: `Ticket status updated to ${status}.`, data: serializeTicket(ticket.toObject()) });
  } catch {
    res.status(500).json({ success: false, message: "Could not update support ticket status." });
  }
});

export default router;
