import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import ChatMessage from "../models/ChatMessage.js";
import ContactMessage from "../models/ContactMessage.js";
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
}
