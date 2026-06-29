import Booking from "../models/Booking.js";
import Category from "../models/Category.js";
import ContactMessage from "../models/ContactMessage.js";
import Provider from "../models/Provider.js";
import Service from "../models/Service.js";
import Session from "../models/Session.js";
import SiteContent from "../models/SiteContent.js";
import User from "../models/User.js";
import {
  defaultCategories,
  defaultServices,
  defaultSiteContents,
  finalCategoryTitles,
  finalServiceTitles,
} from "../data/defaultCatalog.js";
import { defaultProviders } from "../data/defaultProviders.js";

const models = [
  User,
  Booking,
  ContactMessage,
  Category,
  Provider,
  Service,
  Session,
  SiteContent,
];

export default async function setupDatabase() {
  await Promise.all(models.map((model) => model.createCollection()));
  await User.updateMany({ role: { $exists: false } }, { $set: { role: "user", phone: "" } });
  await User.updateMany(
    { profileStatus: { $exists: false } },
    { $set: { profileStatus: "active", address: "", currentLocation: {} } }
  );
  await User.updateMany(
    { profileComplete: { $exists: false }, email: { $regex: /^phone\.\d{10}@servicehub\.local$/i } },
    { $set: { profileComplete: false, name: "", address: "" } }
  );
  await User.updateMany(
    { profileComplete: { $exists: false }, email: { $not: /^phone\.\d{10}@servicehub\.local$/i } },
    { $set: { profileComplete: true } }
  );
  await Provider.updateMany(
    { availabilityStatus: { $exists: false } },
    { $set: { availabilityStatus: "available", trackingConsent: false, trackingActive: false, currentLocation: {} } }
  );
  await Booking.updateMany(
    { costEstimate: { $exists: false } },
    { $set: { costEstimate: 299, workImage: "", completedAt: null } }
  );
  await Booking.updateMany(
    { clientPaymentStatus: { $exists: false } },
    {
      $set: {
        clientPaymentStatus: "pending",
        clientPaidAt: null,
        adminPayoutStatus: "not_ready",
        providerSharePercent: 80,
        providerPayoutAmount: 0,
        providerWithdrawnAmount: 0,
        adminPayoutReleasedAt: null,
        adminPayoutNote: "",
      },
    }
  );
  await Booking.updateMany(
    { estimateStatus: { $exists: false } },
    {
      $set: {
        finalEstimateAmount: 0,
        estimateStatus: "not_submitted",
        estimateSubmittedAt: null,
        estimateAcceptedAt: null,
        estimateRejectedAt: null,
        estimateRejectionReason: "",
        paymentStatus: "unpaid",
        paymentReference: "",
        receiptUrl: "",
      },
    }
  );
  await Booking.updateMany(
    { paymentOrderId: { $exists: false } },
    { $set: { paymentOrderId: "", paymentGateway: "" } }
  );
  await Booking.updateMany(
    { adminCommissionAmount: { $exists: false } },
    { $set: { adminCommissionPercent: 20, adminCommissionAmount: 0 } }
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
        update: { $set: service },
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

  await SiteContent.bulkWrite(
    defaultSiteContents.map((content) => ({
      updateOne: {
        filter: { sectionKey: content.sectionKey },
        update: { $set: content },
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

  if (process.env.SEED_TEST_ACCOUNTS === "true") {
    const testEmail = (process.env.TEST_PROVIDER_EMAIL || "provider.e2e@servicehub.local").trim().toLowerCase();
    const testPassword = process.env.TEST_PROVIDER_PASSWORD || "change_this_test_password";
    let testUser = await User.findOne({ email: testEmail });

    if (!testUser) {
      testUser = await User.create({
        name: defaultProviders[0].name,
        email: testEmail,
        password: testPassword,
        phone: defaultProviders[0].phone,
        role: "provider",
      });
    } else if (testUser.role !== "provider") {
      testUser.role = "provider";
      await testUser.save();
    }

    await Provider.updateOne(
      { providerCode: defaultProviders[0].providerCode },
      { $set: { owner: testUser._id, email: testEmail } }
    );
  }

  await Category.updateMany(
    { title: { $nin: finalCategoryTitles } },
    { $set: { isActive: false } }
  );
  await Service.updateMany(
    { title: { $nin: finalServiceTitles } },
    { $set: { isActive: false } }
  );

  const providerCategoryNormalizations = [
    { from: ["Washing Machine Repair"], to: "Washing Machine" },
    { from: ["Refrigerator Repair", "Fridge Repair"], to: "Refrigerator" },
    { from: ["TV Repair", "Television Repair"], to: "Television" },
    { from: ["Water Purifier", "Water Purifier Service and Repair", "RO Purifier"], to: "RO/Water Purifier" },
    { from: ["Cooler Repair"], to: "Air Cooler" },
    { from: ["Geyser Service & Repair", "Geyser Service"], to: "Geyser" },
    { from: ["Furniture", "Furniture Repair"], to: "Furniture Assembly" },
    { from: ["Painting Service", "Painter", "Water Proofing"], to: "Painting & Water-proofing" },
    { from: ["Bed Bug Control", "Bedbugs Control"], to: "Bed Bugs Control" },
  ];

  for (const { from, to } of providerCategoryNormalizations) {
    await Provider.updateMany(
      { category: { $in: from } },
      { $set: { category: to, isActive: true, availabilityStatus: "available" } }
    );
  }

  await Provider.updateMany(
    { category: { $in: finalServiceTitles }, isActive: false, approvalStatus: "approved" },
    { $set: { isActive: true, availabilityStatus: "available" } }
  );
}
