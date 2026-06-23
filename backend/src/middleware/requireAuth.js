import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { jwtSecret } from "../config/auth.js";
import Session from "../models/Session.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const [session] = await Session.aggregate([
      {
        $match: {
          tokenHash: hashToken(token),
          status: "active",
          expiresAt: { $gt: new Date() },
        },
      },
      { $limit: 1 },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "authenticatedUser",
        },
      },
      { $unwind: "$authenticatedUser" },
      {
        $project: {
          user: 1,
          authenticatedUser: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            address: 1,
            profileImage: 1,
            role: 1,
          },
        },
      },
    ]);

    

    if (!session || String(session.user) !== String(decoded.userId)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const user = session.authenticatedUser;

    if (!user) {
      return res.status(401).json({ message: "Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
