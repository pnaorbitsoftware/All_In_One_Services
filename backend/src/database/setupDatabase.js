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
  defaultProviders,
  defaultServices,
  defaultSiteContents,
} from "../data/defaultCatalog.js";

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
  await Booking.updateMany(
    { costEstimate: { $exists: false } },
    { $set: { costEstimate: 299, workImage: "", completedAt: null } }
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
