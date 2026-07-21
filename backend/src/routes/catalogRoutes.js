import express from "express";

import Category from "../models/Category.js";
import Provider from "../models/Provider.js";
import Service from "../models/Service.js";
import SiteContent from "../models/SiteContent.js";

const router = express.Router();
const catalogCacheTtlMs = Number(process.env.CATALOG_CACHE_TTL_MS || 30_000);
let catalogCache = null;
let catalogLoadPromise = null;
export const invalidateCatalogCache = () => {
  if (catalogCache) catalogCache.expiresAt = 0;
};

const loadCatalog = () => {
  if (!catalogLoadPromise) {
    catalogLoadPromise = Promise.all([
      Category.find({ isActive: true }).sort({ displayOrder: 1, title: 1 }).lean(),
      Service.find({ isActive: true }).sort({ title: 1 }).lean(),
      Provider.find({ approvalStatus: "approved" })
        .select("name businessName category customCategory location preferredWorkLocation rating reviews responseTime price description about features profileImage approvalStatus isActive availabilityStatus")
        .sort({ isActive: -1, rating: -1, reviews: -1 })
        .lean(),
      SiteContent.find({ isActive: true }).sort({ sectionKey: 1 }).lean(),
    ])
      .then(([categories, services, providers, siteContents]) => {
        const payload = { categories, services, providers, siteContents };
        catalogCache = { payload, expiresAt: Date.now() + catalogCacheTtlMs };
        return payload;
      })
      .finally(() => {
        catalogLoadPromise = null;
      });
  }

  return catalogLoadPromise;
};

export const warmCatalogCache = () => loadCatalog();

router.get("/", async (_req, res) => {
  try {
    if (catalogCache) {
      if (catalogCache.expiresAt <= Date.now()) {
        loadCatalog().catch((error) => {
          console.warn(`Catalog background refresh failed: ${error.message}`);
        });
      }

      res.set("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
      return res.json(catalogCache.payload);
    }

    const payload = await loadCatalog();
    res.set("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: "Catalog could not be loaded." });
  }
});

export default router;
