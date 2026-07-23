import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import ContactMessage from "../models/ContactMessage.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendEmail,
  sendProviderApprovalEmail,
  sendProviderAcceptedEmail,
  sendProviderRejectionEmail,
  sendProviderRequestEmail,
  sendServiceRejectedEmail,
  sendServiceCompletedEmail,
} from "../services/mailService.js";
import { buildStatusUpdateOperation } from "../services/bookingTrackingService.js";
import { emitStatusChange } from "../socket/trackingSocket.js";
import { invalidateCatalogCache } from "./catalogRoutes.js";
import {
  sendBookingAcceptedWhatsApp,
  sendCancellationWhatsApp,
  sendProviderApprovalWhatsApp,
  sendProviderRejectionWhatsApp,
  sendProviderRequestWhatsApp,
  sendServiceCompletedWhatsApp,
} from "../services/whatsappNotificationService.js";

const router = express.Router();

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Superadmin access required." });
  }

  next();
};

const documentMimeType = (value = "") => {
  const dataMime = String(value).match(/^data:([^;,]+)/i)?.[1];
  if (dataMime) return dataMime.toLowerCase();
  if (/\.pdf(?:\?|#|$)/i.test(value)) return "application/pdf";
  if (/\.png(?:\?|#|$)/i.test(value)) return "image/png";
  if (/\.webp(?:\?|#|$)/i.test(value)) return "image/webp";
  return value ? "image/jpeg" : "";
};

const documentSize = (value = "") => {
  const base64 = String(value).match(/^data:[^;,]+;base64,([a-z0-9+/=\s]+)$/i)?.[1];
  return base64 ? Math.floor(base64.replace(/\s/g, "").length * 0.75) : null;
};

const adminDocumentMetadata = ({ available, value, fileName, uploadedAt, side, providerId }) => ({
  available: Boolean(available),
  fileName: fileName || "",
  mimeType: available ? documentMimeType(value) : "",
  size: available ? documentSize(value) : null,
  uploadedAt: uploadedAt || null,
  viewUrl: available ? `/admin/providers/${providerId}/aadhaar/${side}` : "",
  downloadUrl: available ? `/admin/providers/${providerId}/aadhaar/${side}?download=1` : "",
});

router.get("/dashboard", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [users, providers, bookings, contactMessages] = await Promise.all([
      User.find({ role: "user" })
        .select("name email phone address profileImage createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean(),
      Provider.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $project: {
            name: 1,
            businessName: 1,
            ownerName: 1,
            category: 1,
            customCategory: 1,
            phone: 1,
            email: 1,
            preferredWorkLocation: 1,
            location: 1,
            address: 1,
            rating: 1,
            reviews: 1,
            approvalStatus: 1,
            verificationStatus: 1,
            verificationRejectedReason: 1,
            aadhaarNumberMasked: 1,
            aadhaarDocumentName: 1,
            aadhaarBackDocumentName: 1,
            aadhaarFrontUploadedAt: 1,
            aadhaarBackUploadedAt: 1,
            aadhaarFrontUrl: {
              $ifNull: ["$aadhaarFrontUrl", { $ifNull: ["$aadhaarCardImage", { $ifNull: ["$aadhaarImage", { $ifNull: ["$aadhaarUrl", { $ifNull: ["$aadhaar", "$aadhar"] }] }] }] }],
            },
            aadhaarBackUrl: { $ifNull: ["$aadhaarBackUrl", { $ifNull: ["$aadhaarBackImage", "$aadharBack"] }] },
            aadhaarFrontAvailable: {
              $ne: [{ $ifNull: ["$aadhaarFrontUrl", { $ifNull: ["$aadhaarCardImage", { $ifNull: ["$aadhaarImage", { $ifNull: ["$aadhaarUrl", { $ifNull: ["$aadhaar", { $ifNull: ["$aadhar", ""] }] }] }] }] }] }, ""],
            },
            aadhaarBackAvailable: {
              $ne: [{ $ifNull: ["$aadhaarBackUrl", ""] }, ""],
            },
            isActive: 1,
            requestedAt: 1,
            approvedAt: 1,
            rejectedAt: 1,
            suspendedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            totalEarnings: 1,
            pendingEarnings: 1,
            paidEarnings: 1,
          },
        },
      ]),
      Booking.find()
        .select("bookingId name phone userEmail service preferredDate preferredTime costEstimate status assignedProvider requestedProvider requestedProviderName assignedProviderName finalEstimateAmount providerPaymentReleased providerPaymentReleasedAt cancelledBy adminRejectedAt adminRejectionReason createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      ContactMessage.find()
        .select("name email phone message status adminReply repliedAt createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const totalCostEstimate = bookings.reduce(
      (total, booking) => total + (booking.costEstimate || 0),
      0,
    );

    const normalizedProviders = providers.map((provider) => {
      const { aadhaarFrontUrl = "", aadhaarBackUrl = "", ...safeProvider } = provider;
      const front = adminDocumentMetadata({
        available: provider.aadhaarFrontAvailable,
        value: aadhaarFrontUrl,
        fileName: provider.aadhaarDocumentName,
        uploadedAt: provider.aadhaarFrontUploadedAt || provider.updatedAt,
        side: "front",
        providerId: provider._id,
      });
      const back = adminDocumentMetadata({
        available: provider.aadhaarBackAvailable,
        value: aadhaarBackUrl,
        fileName: provider.aadhaarBackDocumentName,
        uploadedAt: provider.aadhaarBackUploadedAt || provider.updatedAt,
        side: "back",
        providerId: provider._id,
      });
      return {
      ...safeProvider,
      businessName: provider.businessName || provider.name || "Unnamed provider",
      ownerName: provider.ownerName || "Not provided",
      verificationStatus:
        provider.verificationStatus ||
        (provider.approvalStatus === "approved" ? "legacy_approved" : "pending"),
      verificationRejectedReason: provider.verificationRejectedReason || "",
      aadhaarNumberMasked: provider.aadhaarNumberMasked || "Not submitted",
      aadhaarFrontAvailable: Boolean(provider.aadhaarFrontAvailable),
      aadhaarBackAvailable: Boolean(provider.aadhaarBackAvailable),
      aadhaarDocumentName: provider.aadhaarDocumentName || "",
      aadhaarBackDocumentName: provider.aadhaarBackDocumentName || "",
      documents: { aadhaarFront: front, aadhaarBack: back },
    };
    });

    res.json({
      stats: {
        totalUsers: users.length,
        totalProviders: providers.length,
        totalBookings: bookings.length,
        pendingWork: bookings.filter(
          (booking) =>
            booking.status !== "completed" &&
            !(
              booking.status === "cancelled" &&
              (["client", "admin"].includes(booking.cancelledBy) ||
                booking.adminRejectedAt ||
                booking.adminRejectionReason)
            ),
        ).length,
        completedWork: bookings.filter(
          (booking) =>
            booking.status === "completed" ||
            (booking.status === "cancelled" &&
              (booking.cancelledBy === "client" ||
                booking.adminRejectedAt ||
                booking.adminRejectionReason)),
        ).length,
        totalCostEstimate,
      },
      users,
      providers: normalizedProviders,
      bookings,
      contactMessages,
    });
  } catch (error) {
    res.status(500).json({ message: "Admin dashboard could not be loaded." });
  }
});

router.patch("/providers/:providerId/approval", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { approvalStatus, rejectionReason = "" } = req.body;

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid provider approval status." });
    }

    const provider = await Provider.findById(req.params.providerId);

    if (!provider) {
      return res.status(404).json({ message: "Provider not found." });
    }

    if (!provider.aadhaarCardImage?.trim()) {
      return res.status(400).json({ message: "Aadhaar document is required before this provider can be reviewed." });
    }

    const normalizedRejectionReason = String(rejectionReason || "").trim();
    if (approvalStatus === "rejected" && !normalizedRejectionReason) {
      return res.status(400).json({ message: "A rejection reason is required." });
    }

    const now = new Date();
    provider.approvalStatus = approvalStatus;
    provider.isActive = approvalStatus === "approved";
    provider.approvedAt = approvalStatus === "approved" ? now : null;
    provider.rejectedAt = approvalStatus === "rejected" ? now : null;
    provider.rejectionReason = approvalStatus === "rejected" ? normalizedRejectionReason : "";
    await provider.save();

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ message: "Provider approval could not be updated." });
  }
});


router.patch("/providers/:providerId/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { availabilityStatus } = req.body;
    const validAvailabilityStatuses = ["available", "active", "absent", "inactive"];
    const unavailableAvailabilityStatuses = ["absent", "inactive"];

    if (!validAvailabilityStatuses.includes(availabilityStatus)) {
      return res.status(400).json({
        message: `Invalid provider availability status. Must be one of: ${validAvailabilityStatuses.join(", ")}.`,
      });
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.providerId,
      {
        availabilityStatus,
        isActive: !unavailableAvailabilityStatuses.includes(availabilityStatus),
      },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider not found." });
    }

    res.json({ provider, message: "Provider status updated." });
  } catch (error) {
    res.status(500).json({ message: "Provider status could not be updated." });
  }
});

router.get("/staff-locations", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const providers = await Provider.find({ approvalStatus: "approved" })
      .select("name category phone email location isActive availabilityStatus trackingActive trackingConsent currentLocation updatedAt")
      .sort({ "currentLocation.timestamp": -1, updatedAt: -1 })
      .lean();

    res.json({ providers });
  } catch (error) {
    res.status(500).json({ message: "Staff locations could not be loaded." });
  }
});

router.get(
  "/providers/:providerId/aadhaar/:side",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const side = req.params.side === "back" ? "back" : "front";
      const provider = await Provider.collection.findOne({ _id: new Provider.base.Types.ObjectId(req.params.providerId) });

      if (!provider) {
        return res.status(404).json({ message: "Provider not found." });
      }

      const documentUrl = side === "back"
        ? provider.aadhaarBackUrl || provider.aadhaarBackImage || provider.aadharBack
        : provider.aadhaarFrontUrl || provider.aadhaarCardImage || provider.aadhaarImage || provider.aadhaarUrl || provider.aadhaar || provider.aadhar;
      const documentName = side === "back"
        ? provider.aadhaarBackDocumentName
        : provider.aadhaarDocumentName;

      if (!documentUrl) {
        return res.status(404).json({ message: `Aadhaar ${side} document is not available.` });
      }

      if (/^https:\/\//i.test(documentUrl)) {
        return res.redirect(302, documentUrl);
      }

      const match = documentUrl.match(/^data:([^;,]+);base64,([a-z0-9+/=\s]+)$/i);
      if (!match || !["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"].includes(match[1].toLowerCase())) {
        return res.status(415).json({ message: "Stored Aadhaar document format is not supported." });
      }

      const fileBuffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
      const safeName = encodeURIComponent(documentName || `aadhaar-${side}`);
      res.setHeader("Cache-Control", "private, no-store");
      const disposition = ["1", "true"].includes(String(req.query.download || "").toLowerCase()) ? "attachment" : "inline";
      res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${safeName}`);
      res.type(match[1]).send(fileBuffer);
    } catch {
      res.status(500).json({ message: "Aadhaar document could not be loaded." });
    }
  },
);

router.get(
  "/contact-messages",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const contactMessages = await ContactMessage.find().sort({
        createdAt: -1,
      }).lean();
      res.json({ contactMessages });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Contact messages could not be loaded." });
    }
  },
);

router.patch(
  "/contact-messages/:messageId/reply",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { reply = "" } = req.body;
      const trimmedReply = reply.trim();

      if (!trimmedReply) {
        return res.status(400).json({ message: "Reply message is required." });
      }

      const contactMessage = await ContactMessage.findById(
        req.params.messageId,
      );

      if (!contactMessage) {
        return res.status(404).json({ message: "Client message not found." });
      }

      const recipients = [contactMessage.email, req.user.email].filter(Boolean);

      const emailResult = await sendEmail({
        to: [...new Set(recipients)],
        subject: "ServiceHub support replied to your message",
        text: `Hi ${contactMessage.name},\n\n${trimmedReply}\n\nOriginal message:\n${contactMessage.message}`,
        html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2>ServiceHub support reply</h2>
          <p>Hi ${escapeHtml(contactMessage.name)},</p>
          <div style="padding:16px;border-radius:14px;background:#f4f7fb;border:1px solid #e8eef7">
            ${escapeHtml(trimmedReply).replace(/\n/g, "<br />")}
          </div>
          <p style="margin-top:18px;color:#64748b;font-size:14px">Original message:</p>
          <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #0f9f9a;background:#fbfdff;color:#475569">
            ${escapeHtml(contactMessage.message).replace(/\n/g, "<br />")}
          </blockquote>
        </div>
      `,
      });

      if (!emailResult.sent) {
        return res.status(500).json({
          message:
            emailResult.reason ||
            "Reply email could not be sent. Check Brevo SMTP/API settings.",
        });
      }

      contactMessage.adminReply = trimmedReply;
      contactMessage.repliedAt = new Date();
      contactMessage.repliedBy = req.user._id;
      contactMessage.status = "replied";
      await contactMessage.save();

      res.json({ contactMessage, email: emailResult });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Client message reply could not be sent." });
    }
  },
);

router.patch(
  "/contact-messages/:messageId/mark-replied",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { reply = "" } = req.body;
      const trimmedReply = reply.trim();

      if (!trimmedReply) {
        return res.status(400).json({ message: "Reply message is required." });
      }

      const contactMessage = await ContactMessage.findByIdAndUpdate(
        req.params.messageId,
        {
          adminReply: trimmedReply,
          repliedAt: new Date(),
          repliedBy: req.user._id,
          status: "replied",
        },
        { new: true },
      );

      if (!contactMessage) {
        return res.status(404).json({ message: "Client message not found." });
      }

      res.json({ contactMessage });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Client message could not be marked replied." });
    }
  },
);

router.patch(
  "/providers/:providerId/approval",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { approvalStatus, rejectionReason = "" } = req.body;

      if (!["approved", "rejected"].includes(approvalStatus)) {
        return res
          .status(400)
          .json({ message: "Invalid provider approval status." });
      }

      const now = new Date();
      const provider = await Provider.findOneAndUpdate(
        {
          _id: req.params.providerId,
          ...(approvalStatus === "approved" ? { aadhaarFrontUrl: { $nin: ["", null] } } : {}),
        },
        {
          $set: {
            approvalStatus,
            verificationStatus: approvalStatus === "approved" ? "approved" : "rejected",
            isActive: approvalStatus === "approved",
            approvedAt: approvalStatus === "approved" ? now : null,
            ...(approvalStatus === "rejected"
              ? { rejectedAt: now, suspendedAt: now }
              : {}),
            verificationRejectedReason:
              approvalStatus === "rejected"
                ? rejectionReason || "Provider profile was not approved by admin."
                : "",
          },
        },
        { new: true },
      );

      if (!provider) {
        const providerExists = await Provider.exists({ _id: req.params.providerId });
        return res.status(providerExists ? 400 : 404).json({
          message: providerExists
            ? "Aadhaar document verification is required before approving this provider."
            : "Provider not found.",
        });
      }

      invalidateCatalogCache();

      if (approvalStatus === "approved") {
        sendProviderApprovalEmail({
          to: provider.email,
          name: provider.name,
        }).catch((error) => console.warn(`Provider approval email failed: ${error.message}`));
        sendProviderApprovalWhatsApp({
          to: provider.phone,
          name: provider.name,
        }).catch(() => {});
      } else {
        sendProviderRejectionEmail({
          to: provider.email,
          name: provider.name,
          reason:
            rejectionReason ||
            "Your provider profile could not be approved at this time.",
        }).catch((error) => console.warn(`Provider rejection email failed: ${error.message}`));
        sendProviderRejectionWhatsApp({
          to: provider.phone,
          name: provider.name,
          reason:
            rejectionReason ||
            "Your provider profile could not be approved at this time.",
        }).catch(() => {});
      }

      res.json({ provider });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Provider approval could not be updated." });
    }
  },
);

router.patch(
  "/bookings/:bookingId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, providerId, adminRejectionReason = "" } = req.body;
      const allowedStatuses = [
        "pending",
        "accepted",
        "assigned",
        "confirmed",
        "on_the_way",
        "en_route",
        "arrived",
        "job_started",
        "completed",
        "cancelled",
      ];
      const update = {};
      const existingBooking = await Booking.findById(req.params.bookingId);

      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found." });
      }

      if (status) {
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid booking status." });
        }

        update.status = status;

        if (status === "accepted") {
          update.acceptedAt = new Date();
        } else if (status === "cancelled") {
          if (adminRejectionReason !== "" && !adminRejectionReason.trim()) {
            return res.status(400).json({
              message: "Please describe why this request is being rejected.",
            });
          }
          update.cancelledBy = "admin";
          update.cancelledAt = new Date();

          if (adminRejectionReason.trim()) {
            update.cancelledBy =
              existingBooking?.cancelledBy === "provider"
                ? "provider"
                : "admin";
            update.adminRejectionReason = adminRejectionReason.trim();
            update.adminRejectedAt = new Date();
          }
        }
      }

      if (providerId) {
        const provider = await Provider.findOne({
          _id: providerId,
          isActive: true,
          approvalStatus: "approved",
        });

        if (!provider) {
          return res
            .status(400)
            .json({ message: "Choose an approved active provider." });
        }

        update.assignedProvider = provider._id;
        update.assignedProviderName = provider.name;
        update.assignedAt = new Date();
        update.status = "accepted";
        update.cancelledBy = "";
        update.cancelledAt = null;
        update.cancellationReason = "";
        update.adminRejectionReason = "";
        update.adminRejectedAt = null;
      }

      const updateOperation =
        status || providerId
          ? buildStatusUpdateOperation({
              booking:
                providerId &&
                existingBooking.status === "cancelled" &&
                existingBooking.cancelledBy === "provider"
                  ? { status: "pending" }
                  : existingBooking,
              status: update.status || existingBooking.status,
              set: update,
            })
          : { $set: update };

      const booking = await Booking.findByIdAndUpdate(
        req.params.bookingId,
        updateOperation,
        {
          new: true,
        },
      )
        .populate("user", "name email phone role")
        .populate("assignedProvider")
        .populate("requestedProvider");
      const client = booking.user?._id
        ? booking.user
        : await User.findById(booking.user);

      if (providerId && booking.assignedProvider) {
        await sendProviderAcceptedEmail({
          to: client?.email,
          name: client?.name || booking.name,
          booking,
          provider: booking.assignedProvider,
        });
        sendBookingAcceptedWhatsApp({
          to: client?.phone || booking.phone,
          name: client?.name || booking.name,
          booking,
          provider: booking.assignedProvider,
        }).catch(() => {});

        if (booking.assignedProvider.email) {
          await sendProviderRequestEmail({
            to: booking.assignedProvider.email,
            providerName: booking.assignedProvider.name,
            booking,
          });
        }
        sendProviderRequestWhatsApp({
          to: booking.assignedProvider.phone,
          providerName: booking.assignedProvider.name,
          booking,
        }).catch(() => {});
      }

      if (status === "completed") {
        await sendServiceCompletedEmail({
          to: client?.email,
          name: client?.name || booking.name,
          booking,
          providerName: booking.assignedProviderName,
        });
        sendServiceCompletedWhatsApp({
          to: client?.phone || booking.phone,
          name: client?.name || booking.name,
          booking,
          providerName: booking.assignedProviderName,
        }).catch(() => {});
      }

      if (status === "cancelled" && adminRejectionReason.trim()) {
        await sendServiceRejectedEmail({
          to: client?.email,
          name: client?.name || booking.name,
          booking,
          reason: adminRejectionReason.trim(),
        });
        sendCancellationWhatsApp({
          to: client?.phone || booking.phone,
          booking,
          reason: adminRejectionReason.trim(),
          cancelledBy: "admin",
        }).catch(() => {});
      }

      emitStatusChange(req.app.get("io"), booking);

      res.json({ booking });
    } catch (error) {
      if (
        /booking status|completed bookings|cannot move/i.test(error.message)
      ) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ message: "Booking could not be updated." });
    }
  },
);
router.patch(
  "/bookings/:bookingId/release-payment",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.bookingId);

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found.",
        });
      }

      booking.providerPaymentReleased = true;
      booking.providerPaymentReleasedAt = new Date();

      await booking.save();

      res.json({
        success: true,
        booking,
      });
    } catch (error) {
      res.status(500).json({
        message: "Payment could not be released.",
      });
    }
  },
);

export default router;
