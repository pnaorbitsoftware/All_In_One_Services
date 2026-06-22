import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import ChatMessage from "../models/ChatMessage.js";
import ContactMessage from "../models/ContactMessage.js";
import Notification from "../models/Notification.js";
import SupportTicket from "../models/SupportTicket.js";
import SupportCounter from "../models/SupportCounter.js";
import SupportFaq from "../models/SupportFaq.js";
import GpsHistory from "../models/GpsHistory.js";
import Ledger from "../models/Ledger.js";
import Payment from "../models/Payment.js";
import Provider from "../models/Provider.js";
import Service from "../models/Service.js";
import Session from "../models/Session.js";
import SiteContent from "../models/SiteContent.js";
import User from "../models/User.js";
import {
  defaultCategories,
  defaultProviders,
  defaultServices,
  defaultSiteContents,
} from "../data/defaultCatalog.js";

const models = [
  User,
  Booking,
  ChatMessage,
  Payment,
  Ledger,
  GpsHistory,
  ContactMessage,
  Category,
  Provider,
  Service,
  Session,
  SiteContent,
  SupportTicket,
  SupportCounter,
  SupportFaq,
  Notification,
];

const defaultSupportFaqs = [
  {
    question: "How do I reset my password?",
    answer: "Open Login, choose Forgot password, verify the OTP sent to your registered email or phone, and create a new password.",
    category: "Account",
    sortOrder: 1,
  },
  {
    question: "How do I track my service booking?",
    answer: "Open your dashboard and select the active booking. Accepted jobs show the provider status, route updates, payment state, and service progress.",
    category: "Service",
    sortOrder: 2,
  },
  {
    question: "How do I raise a payment or refund issue?",
    answer: "Use Help & Support, choose Payment Issue, set the priority, and describe the charge or refund problem. Our support team will review it from the admin panel.",
    category: "Payment",
    sortOrder: 3,
  },
  {
    question: "Can providers create support tickets?",
    answer: "Yes. Logged-in providers can create tickets without entering name, email, or phone details manually.",
    category: "Provider",
    sortOrder: 4,
  },
  {
    question: "Where can I see replies from support?",
    answer: "Open My Support Tickets from the Help Center or your dashboard. Admin responses appear on each ticket with the latest status.",
    category: "Support",
    sortOrder: 5,
  },
];

export default async function setupDatabase() {
  await Promise.all(models.map((model) => model.createCollection()));
  await Promise.all(models.map((model) => model.createIndexes()));
  const collections = await Booking.db.db.listCollections({ name: "gps_history" }).toArray();
  if (!collections.length) {
    try {
      await Booking.db.db.createCollection("gps_history", {
        capped: true,
        size: 10485760,
        max: 50000,
      });
    } catch (error) {
      if (!/already exists|namespace/i.test(error.message)) {
        throw error;
      }
    }
  }
  try {
    await GpsHistory.syncIndexes();
  } catch (error) {
    console.warn(`GPS history indexes could not be synchronized: ${error.message}`);
  }

  await User.updateMany({ role: { $exists: false } }, { $set: { role: "user", phone: "" } });
  const bookingsWithoutPublicIds = await Booking.find({
    $or: [{ bookingId: { $exists: false } }, { bookingId: "" }, { bookingId: null }],
  }).select("_id");
  await Promise.all(
    bookingsWithoutPublicIds.map((booking) =>
      Booking.updateOne(
        { _id: booking._id },
        { $set: { bookingId: `SH-${Date.now().toString(36).toUpperCase()}-${booking._id.toString().slice(-5).toUpperCase()}` } }
      )
    )
  );
  await Booking.updateMany(
    { costEstimate: { $exists: false } },
    { $set: { costEstimate: 299, workImage: "", completedAt: null } }
  );
  await Booking.updateMany(
    { estimateStatus: { $exists: false } },
    {
      $set: {
        finalEstimateAmount: 0,
        estimateSubmittedBy: null,
        estimateSubmittedAt: null,
        estimateStatus: "not_submitted",
        paymentStatus: "unpaid",
        razorpayOrderId: "",
        razorpayPaymentId: "",
        providerShare: 0,
        platformFee: 0,
        clientRejectionPenalty: 0,
        paymentCompletedAt: null,
      },
    }
  );
  await Provider.updateMany(
    { totalEarnings: { $exists: false } },
    {
      $set: {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
      },
    }
  );

  await SupportTicket.updateMany(
    { role: { $exists: false } },
    { $set: { role: "user", userPhone: "" } }
  );
  await SupportTicket.updateMany(
    { category: { $in: ["Booking Issue", "Provider Issue", "General Inquiry"] } },
    { $set: { category: "Service Issue" } }
  );
  await SupportTicket.updateMany(
    { priority: "Urgent" },
    { $set: { priority: "High" } }
  );
  await SupportTicket.updateMany(
    { status: { $in: ["Assigned", "Waiting for Customer"] } },
    { $set: { status: "In Progress" } }
  );
  await SupportTicket.updateMany(
    { ticketNumber: { $in: [null, ""] } },
    [{ $set: { ticketNumber: "$ticketId" } }]
  );

  const adminEmail = process.env.ADMIN_EMAIL || "admin@servicehub.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminCount = await User.countDocuments({ role: "admin" });

  if (adminCount === 0) {
    const existingConfiguredUser = await User.findOne({ email: adminEmail });

    if (existingConfiguredUser) {
      existingConfiguredUser.name = existingConfiguredUser.name || "ServiceHub Superadmin";
      existingConfiguredUser.password = adminPassword;
      existingConfiguredUser.role = "admin";
      existingConfiguredUser.phone = existingConfiguredUser.phone || "";
      await existingConfiguredUser.save();
    } else {
      await User.create({
        name: "ServiceHub Superadmin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        phone: "",
      });
    }
  }

  if (adminCount > 0) {
    await User.updateMany(
      { email: adminEmail, role: { $ne: "admin" } },
      { $set: { role: "user" } }
    );
  }

  const admins = await User.find({ role: "admin" }).sort({ createdAt: 1 });

  if (admins.length > 1) {
    await User.updateMany(
      { _id: { $in: admins.slice(1).map((admin) => admin._id) } },
      { $set: { role: "user" } }
    );
  }

  /*
   * Superadmin is intentionally seeded only when no admin exists.
   * Registration never creates admins, so the project keeps one admin account.
   */

  await Service.bulkWrite(
    defaultServices.map((service) => ({
      updateOne: {
        filter: { serviceCode: service.serviceCode },
        update: { $setOnInsert: service },
        upsert: true,
      },
    }))
  );

  await Category.bulkWrite(
    defaultCategories.map((category) => ({
      updateOne: {
        filter: { categoryCode: category.categoryCode },
        update: { $set: category },
        upsert: true,
      },
    }))
  );

  await Provider.bulkWrite(
    defaultProviders.map((provider) => ({
      updateOne: {
        filter: { providerCode: provider.providerCode },
        update: { $set: provider },
        upsert: true,
      },
    }))
  );

  await SiteContent.bulkWrite(
    defaultSiteContents.map((content) => ({
      updateOne: {
        filter: { sectionKey: content.sectionKey },
        update: { $set: content },
        upsert: true,
      },
    }))
  );

  await SupportCounter.updateOne(
    { key: "supportTicket" },
    { $setOnInsert: { sequence: 100000 } },
    { upsert: true }
  );

  await SupportFaq.bulkWrite(
    defaultSupportFaqs.map((faq) => ({
      updateOne: {
        filter: { question: faq.question },
        update: { $setOnInsert: faq },
        upsert: true,
      },
    }))
  );
}
