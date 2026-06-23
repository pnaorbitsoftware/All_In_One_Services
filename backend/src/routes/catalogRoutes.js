import express from "express";

import Category from "../models/Category.js";
import Provider from "../models/Provider.js";
import Service from "../models/Service.js";
import SiteContent from "../models/SiteContent.js";
import Booking from "../models/Booking.js";
const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const [categories, services, providers, siteContents] = await Promise.all([
      Category.find({ isActive: true }).sort({ displayOrder: 1, title: 1 }),
      Service.find({ isActive: true }).sort({ title: 1 }),
  Provider.aggregate([
  {
    $match: {
      isActive: true,
      approvalStatus: "approved",
    },
  },
  {
    $lookup: {
      from: "bookings",
      let: {
        providerId: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                {
                  $eq: [
                    "$assignedProvider",
                    "$$providerId",
                  ],
                },
                {
                  $eq: [
                    "$requestedProvider",
                    "$$providerId",
                  ],
                },
              ],
            },
            status: "completed",
            clientRating: {
              $gte: 1,
            },
          },
        },
      ],
      as: "providerReviews",
    },
  },
  {
    $addFields: {
      reviews: {
        $size: "$providerReviews",
      },
      rating: {
        $cond: [
          {
            $gt: [
              {
                $size: "$providerReviews",
              },
              0,
            ],
          },
          {
            $round: [
              {
                $avg:
                  "$providerReviews.clientRating",
              },
              1,
            ],
          },
          0,
        ],
      },
    },
  },
{
  $addFields: {
    trustedProvider: {
      $gte: ["$reviews", 3]
    }
  }
},
{
  $sort: {
    trustedProvider: -1,
    rating: -1,
    reviews: -1
  }
}
]),
      SiteContent.find({ isActive: true }).sort({ sectionKey: 1 }),
    ]);

    res.json({ categories, services, providers, siteContents });
  
  } catch (error) {
    res.status(500).json({ message: "Catalog could not be loaded." });
  }
});

export default router;
