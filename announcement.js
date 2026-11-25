const express = require("express");
const mongoose = require("mongoose");

const { requireAdmin } = require("./adminAuth");

const router = express.Router();

const STATUSES = ["Upcoming", "Active", "Ended", "Cancelled"];
const POSTER_MAX = 2 * 1024 * 1024; // characters of the data URL

const EventAnnouncementSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, trim: true, maxlength: 200 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    eventStatus: { type: String, required: true, enum: STATUSES, default: "Upcoming" },
    // Poster stored as an image data URL (same approach as the existing event images)
    eventPoster: { type: String, default: "", maxlength: POSTER_MAX },
  },
  { collection: "EventAnnouncement", timestamps: true }
);
EventAnnouncementSchema.index({ eventName: 1 });
EventAnnouncementSchema.index({ eventStatus: 1, createdAt: -1 });

const EventAnnouncement =
  mongoose.models.EventAnnouncement || mongoose.model("EventAnnouncement", EventAnnouncementSchema);

const ok = (res, message, data, extra = {}, code = 200) =>
  res.status(code).json({ success: true, message, data, ...extra });
const fail = (res, code, message, error = null) =>
  res.status(code).json({ success: false, message, error });

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Only whitelisted fields are accepted from the client.
function pickBody(body = {}) {
  const out = {};
  for (const k of ["eventName", "comment", "description", "eventStatus", "eventPoster"]) {
    if (body[k] !== undefined) out[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
  }
  return out;
}

function validate(data, partial = false) {
  const errors = [];
  const need = (k, label) => {
    if (!partial || data[k] !== undefined) {
      if (!data[k] || typeof data[k] !== "string") errors.push(`${label} is required`);
    }
  };
  need("eventName", "Event name");
  need("description", "Description");
  if (!partial || data.eventStatus !== undefined) {
    if (!STATUSES.includes(data.eventStatus)) errors.push(`Event status must be one of: ${STATUSES.join(", ")}`);
  }
  if (data.eventPoster) {
    if (typeof data.eventPoster !== "string" || !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(data.eventPoster)) {
      errors.push("Event poster must be a PNG, JPG, WEBP or GIF image");
    } else if (data.eventPoster.length > POSTER_MAX) {
      errors.push("Event poster is too large (max about 1.5 MB)");
    }
  }
  return errors;
}

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/events?search=&status=&page=&limit=
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const filter = {};
    if (req.query.search) filter.eventName = { $regex: escapeRegex(req.query.search), $options: "i" };
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) return fail(res, 400, "Invalid status filter");
      filter.eventStatus = req.query.status;
    }
    const [data, total] = await Promise.all([
      EventAnnouncement.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EventAnnouncement.countDocuments(filter),
    ]);
    return ok(res, "Event announcements retrieved successfully", data, {
      pagination: { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (err) {
    return fail(res, 500, "Something went wrong", err.message);
  }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid event id");
    const doc = await EventAnnouncement.findById(req.params.id).lean();
    if (!doc) return fail(res, 404, "Event announcement not found");
    return ok(res, "Event announcement retrieved successfully", doc);
  } catch (err) {
    return fail(res, 500, "Something went wrong", err.message);
  }
});

// POST /api/events
router.post("/", requireAdmin, async (req, res) => {
  try {
    const data = pickBody(req.body);
    if (data.eventStatus === undefined) data.eventStatus = "Upcoming";
    const errors = validate(data);
    if (errors.length) return fail(res, 400, errors[0], errors);
    const doc = await EventAnnouncement.create(data);
    return ok(res, "Event announcement created successfully", doc, {}, 201);
  } catch (err) {
    return fail(res, 500, "Something went wrong", err.message);
  }
});

// PUT /api/events/:id
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid event id");
    const data = pickBody(req.body);
    const errors = validate(data, true);
    if (errors.length) return fail(res, 400, errors[0], errors);
    const doc = await EventAnnouncement.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).lean();
    if (!doc) return fail(res, 404, "Event announcement not found");
    return ok(res, "Event announcement updated successfully", doc);
  } catch (err) {
    return fail(res, 500, "Something went wrong", err.message);
  }
});

// DELETE /api/events/:id
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid event id");
    const doc = await EventAnnouncement.findByIdAndDelete(req.params.id).lean();
    if (!doc) return fail(res, 404, "Event announcement not found");
    return ok(res, "Event announcement deleted successfully", doc);
  } catch (err) {
    return fail(res, 500, "Something went wrong", err.message);
  }
});

module.exports = router;
