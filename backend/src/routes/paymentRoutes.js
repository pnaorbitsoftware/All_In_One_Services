import crypto from "node:crypto";
import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import {
  applyPaymentSplit,
  buildProviderPaymentSummary,
  DEFAULT_PROVIDER_SHARE_PERCENT,
  getProviderPayoutAmount,
} from "../utils/paymentSummary.js";

const router = express.Router();
const currency = process.env.PAYMENT_CURRENCY || "INR";

const requireProviderRole = (req, res, next) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Provider access required." });
  }

  next();
};

const requireClientRole = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Client access required." });
  }

  next();
};

const findProviderForUser = async (userId) => Provider.findOne({ owner: userId });
const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
const getRazorpayKeySecret = () => process.env.RAZORPAY_KEY_SECRET || "";
const isManualPaymentAllowed = () => process.env.ALLOW_MANUAL_PAYMENT_CONFIRMATION === "true";

function getEstimateAmount(booking) {
  return Math.round(Number(booking.finalEstimateAmount || 0));
}

function assertPayableEstimate(booking) {
  if (!booking) return "Booking not found.";
  if (booking.estimateStatus !== "accepted") return "Accept the provider estimate before payment.";
  if (getEstimateAmount(booking) <= 0) return "Final estimate amount is missing.";
  if (booking.paymentStatus === "paid" || booking.clientPaymentStatus === "paid") return "Payment is already completed.";
  return "";
}

function buildPaymentMeta(booking) {
  const split = applyPaymentSplit(booking);
  return {
    amount: split.amount,
    currency,
    providerSharePercent: split.providerSharePercent,
    providerPayoutAmount: split.providerPayoutAmount,
    adminCommissionPercent: split.adminCommissionPercent,
    adminCommissionAmount: split.adminCommissionAmount,
  };
}

async function createRazorpayOrder({ booking, amount }) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  if (!keyId || !keySecret) {
    const error = new Error("Razorpay keys are not configured on backend.");
    error.status = 501;
    throw error;
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency,
      receipt: `booking_${booking._id}`.slice(0, 40),
      notes: {
        bookingId: String(booking._id),
        service: booking.service,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.description || data.message || "Razorpay order could not be created.");
    error.status = response.status;
    throw error;
  }

  return data;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = getRazorpayKeySecret();
  if (!keySecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

async function loadProviderBookings(userId) {
  const provider = await findProviderForUser(userId);
  if (!provider) return { provider: null, bookings: [] };
  const bookings = await Booking.find({ assignedProvider: provider._id }).sort({ updatedAt: -1 });
  return { provider, bookings };
}

router.get("/my", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "provider") {
      const { provider, bookings } = await loadProviderBookings(req.user._id);

      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found." });
      }

      return res.json({ bookings });
    }

    const bookings = await Booking.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Payments could not be loaded." });
  }
});

router.get("/provider/earnings", requireAuth, requireProviderRole, async (req, res) => {
  try {
    const { provider, bookings } = await loadProviderBookings(req.user._id);

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const summary = buildProviderPaymentSummary(bookings);

    res.json({
      summary,
      earnings: bookings,
      payouts: bookings.filter((booking) => booking.adminPayoutStatus === "released"),
      withdrawals: bookings.filter((booking) => Number(booking.providerWithdrawnAmount || 0) > 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Provider earnings could not be loaded." });
  }
});

router.post("/bookings/:bookingId/estimate", requireAuth, requireProviderRole, async (req, res) => {
  try {
    const finalEstimateAmount = Number(req.body.finalEstimateAmount);

    if (!Number.isFinite(finalEstimateAmount) || finalEstimateAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid final estimate amount." });
    }

    const provider = await findProviderForUser(req.user._id);

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      assignedProvider: provider._id,
      status: { $in: ["accepted", "assigned", "confirmed", "Confirmed", "Provider Assigned", "On The Way", "Arrived", "Service Started"] },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    if (["completed", "cancelled"].includes(String(booking.status || "").toLowerCase())) {
      return res.status(400).json({ message: "Estimate cannot be sent for this booking status." });
    }

    booking.finalEstimateAmount = Math.round(finalEstimateAmount);
    booking.estimateStatus = "submitted";
    booking.estimateSubmittedAt = new Date();
    booking.estimateAcceptedAt = null;
    booking.estimateRejectedAt = null;
    booking.estimateRejectionReason = "";
    booking.paymentStatus = "unpaid";
    booking.clientPaymentStatus = "pending";
    booking.paymentReference = "";
    booking.paymentOrderId = "";
    booking.paymentGateway = "";
    booking.adminPayoutStatus = "not_ready";
    booking.providerWithdrawnAmount = 0;
    booking.adminPayoutReleasedAt = null;
    booking.adminPayoutNote = "";
    booking.providerSharePercent = DEFAULT_PROVIDER_SHARE_PERCENT;
    applyPaymentSplit(booking);
    await booking.save();

    res.json({ message: "Estimate sent to client.", booking });
  } catch (error) {
    res.status(500).json({ message: "Estimate could not be sent." });
  }
});

router.patch("/bookings/:bookingId/estimate/accept", requireAuth, requireClientRole, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.estimateStatus !== "submitted") {
      return res.status(400).json({ message: "No submitted estimate is waiting for approval." });
    }

    booking.estimateStatus = "accepted";
    booking.estimateAcceptedAt = new Date();
    booking.paymentStatus = "pending";
    booking.clientPaymentStatus = "pending";
    booking.adminPayoutStatus = "not_ready";
    applyPaymentSplit(booking);
    await booking.save();

    res.json({ message: "Estimate accepted. Continue to final estimate payment.", booking, payment: buildPaymentMeta(booking) });
  } catch (error) {
    res.status(500).json({ message: "Estimate could not be accepted." });
  }
});

router.patch("/bookings/:bookingId/estimate/reject", requireAuth, requireClientRole, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.estimateStatus !== "submitted") {
      return res.status(400).json({ message: "No submitted estimate is waiting for rejection." });
    }

    booking.estimateStatus = "rejected";
    booking.estimateRejectedAt = new Date();
    booking.estimateRejectionReason = String(req.body.rejectionReason || "").trim();
    booking.paymentStatus = "unpaid";
    booking.clientPaymentStatus = "pending";
    booking.adminPayoutStatus = "not_ready";
    await booking.save();

    res.json({ message: "Estimate rejected.", booking });
  } catch (error) {
    res.status(500).json({ message: "Estimate could not be rejected." });
  }
});

router.post("/create-order", requireAuth, requireClientRole, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    const paymentError = assertPayableEstimate(booking);

    if (paymentError) {
      return res.status(booking ? 400 : 404).json({ message: paymentError });
    }

    const amount = getEstimateAmount(booking);
    applyPaymentSplit(booking);

    const order = await createRazorpayOrder({ booking, amount });
    booking.paymentOrderId = order.id;
    booking.paymentGateway = "razorpay";
    booking.paymentStatus = "pending";
    await booking.save();

    res.json({
      message: "Payment order created.",
      gateway: "razorpay",
      keyId: getRazorpayKeyId(),
      orderId: order.id,
      amount,
      amountPaise: amount * 100,
      currency,
      booking,
      payment: buildPaymentMeta(booking),
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Payment order could not be created." });
  }
});

router.post("/verify", requireAuth, requireClientRole, async (req, res) => {
  try {
    const {
      bookingId,
      paymentReference = "",
      receiptUrl = "",
      razorpay_order_id: razorpayOrderId = "",
      razorpay_payment_id: razorpayPaymentId = "",
      razorpay_signature: razorpaySignature = "",
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required." });
    }

    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
    const paymentError = assertPayableEstimate(booking);

    if (paymentError && paymentError !== "Payment is already completed.") {
      return res.status(booking ? 400 : 404).json({ message: paymentError });
    }

    if (paymentError === "Payment is already completed.") {
      return res.json({ message: "Payment already verified.", booking, payment: buildPaymentMeta(booking) });
    }

    const hasRazorpayPayload = razorpayOrderId && razorpayPaymentId && razorpaySignature;
    if (hasRazorpayPayload) {
      if (booking.paymentOrderId && booking.paymentOrderId !== razorpayOrderId) {
        return res.status(400).json({ message: "Payment order does not match this booking." });
      }

      if (!verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
        return res.status(400).json({ message: "Payment verification failed." });
      }

      booking.paymentReference = razorpayPaymentId;
      booking.paymentOrderId = razorpayOrderId;
      booking.paymentGateway = "razorpay";
    } else if (isManualPaymentAllowed() && paymentReference) {
      booking.paymentReference = paymentReference;
      booking.paymentGateway = "manual";
    } else {
      return res.status(400).json({ message: "Verified Razorpay payment details are required before marking payment successful." });
    }

    booking.paymentStatus = "paid";
    booking.clientPaymentStatus = "paid";
    booking.clientPaidAt = new Date();
    booking.receiptUrl = receiptUrl;
    booking.adminPayoutStatus = "pending";
    applyPaymentSplit(booking);
    await booking.save();

    res.json({ message: "Payment verified. Amount received by admin and provider payout is pending admin release.", booking, payment: buildPaymentMeta(booking) });
  } catch (error) {
    res.status(500).json({ message: "Payment verification could not be saved." });
  }
});

router.post("/provider/withdraw", requireAuth, requireProviderRole, async (req, res) => {
  try {
    const { provider, bookings } = await loadProviderBookings(req.user._id);

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const releasedBookings = bookings.filter((booking) => booking.adminPayoutStatus === "released");
    const available = releasedBookings.reduce((total, booking) => {
      const payout = getProviderPayoutAmount(booking);
      return total + Math.max(payout - Number(booking.providerWithdrawnAmount || 0), 0);
    }, 0);

    const requestedAmount = req.body.amount == null ? available : Math.round(Number(req.body.amount));
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid withdrawal amount." });
    }

    if (requestedAmount > available) {
      return res.status(400).json({ message: "Withdrawal amount is greater than released balance." });
    }

    let remaining = requestedAmount;
    const touchedBookingIds = [];

    for (const booking of releasedBookings) {
      if (remaining <= 0) break;
      const payout = getProviderPayoutAmount(booking);
      const alreadyWithdrawn = Number(booking.providerWithdrawnAmount || 0);
      const bookingAvailable = Math.max(payout - alreadyWithdrawn, 0);
      if (!bookingAvailable) continue;

      const withdrawFromBooking = Math.min(bookingAvailable, remaining);
      booking.providerWithdrawnAmount = alreadyWithdrawn + withdrawFromBooking;
      await booking.save();
      touchedBookingIds.push(booking._id);
      remaining -= withdrawFromBooking;
    }

    const refreshedBookings = await Booking.find({ assignedProvider: provider._id }).sort({ updatedAt: -1 });

    res.json({
      message: "Withdrawal recorded for released provider earnings.",
      withdrawal: {
        amount: requestedAmount,
        bookingIds: touchedBookingIds,
        createdAt: new Date(),
      },
      summary: buildProviderPaymentSummary(refreshedBookings),
      bookings: refreshedBookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Provider withdrawal could not be completed." });
  }
});

export default router;
