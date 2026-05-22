import express from "express";

import Category from "../models/Category.js";
import Provider from "../models/Provider.js";
import Service from "../models/Service.js";
import SiteContent from "../models/SiteContent.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const [categories, services, providers, siteContents] = await Promise.all([
      Category.find({ isActive: true }).sort({ displayOrder: 1, title: 1 }),
      Service.find({ isActive: true }).sort({ title: 1 }),
      Provider.find({ isActive: true }).sort({ rating: -1, reviews: -1 }),
      SiteContent.find({ isActive: true }).sort({ sectionKey: 1 }),
    ]);

    res.json({ categories, services, providers, siteContents });
  } catch (error) {
    res.status(500).json({ message: "Catalog could not be loaded." });
  }
});

export default router;
