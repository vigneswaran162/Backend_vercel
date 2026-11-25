const express = require("express");
const { AddEventsModel, RegisterationEvent } = require("./model");
const { requireAdmin } = require("./adminAuth");

const router = express.Router();

// Registration deadlines are calendar dates; they close at the end of that day in this offset.
const TZ_OFFSET = process.env.EVENT_TZ_OFFSET || "+05:30";
const DAY_MS = 24 * 60 * 60 * 1000;

const notVoid = { Void: { $ne: "Y" } };
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ok = (res, message, data, extra = {}) => res.json({ success: true, message, data, ...extra });
const fail = (res, code, message) => res.status(code).json({ success: false, message });

// ---------------------------------------------------------------------------
// Availability rules (seat limit + deadline + closed status)
// ---------------------------------------------------------------------------
function seatLimitOf(ev) {
  const n = parseInt(ev.PersonAllowed, 10);
  return Number.isFinite(n) && n > 0 ? n : null; // null => unlimited
}

function deadlineOf(ev) {
  if (!ev.EventLastDate) return null;
  const d = new Date(String(ev.EventLastDate).slice(0, 10) + "T23:59:59.999" + TZ_OFFSET);
  return isNaN(d.getTime()) ? null : d;
}

function computeAvailability(ev, registered, now = new Date()) {
  const seatLimit = seatLimitOf(ev);
  const deadline = deadlineOf(ev);
  const msLeft = deadline ? deadline.getTime() - now.getTime() : null;
  const deadlinePassed = msLeft !== null && msLeft < 0;
  const closedByStatus = /^close/i.test(String(ev.Type || ""));
  const isFull = seatLimit !== null && registered >= seatLimit;

  let reason = "";
  if (closedByStatus) reason = "Registration is closed for this event";
  else if (deadlinePassed) reason = "The registration deadline has passed";
  else if (isFull) reason = "All seats are filled";

  return {
    EventNo: ev.EventNo,
    seatLimit,
    registered,
    seatsLeft: seatLimit === null ? null : Math.max(seatLimit - registered, 0),
    isFull,
    deadline: deadline ? deadline.toISOString() : null,
    deadlinePassed,
    closesInDays: msLeft !== null && msLeft >= 0 ? Math.floor(msLeft / DAY_MS) : null,
    isOpen: !reason,
    reason,
  };
}

async function availabilityFor(eventNo, session) {
  const ev = await AddEventsModel.findOne({ EventNo: eventNo, ...notVoid }).session(session || null).lean();
  if (!ev) return null;
  const registered = await RegisterationEvent.countDocuments({ EventNo: eventNo, ...notVoid }).session(session || null);
  return computeAvailability(ev, registered);
}

// Returns an error message when this registration must be rejected, otherwise null.
async function registrationBlocker(entity, session) {
  if (!entity || !entity.EventNo) return "Event is required";
  const a = await availabilityFor(entity.EventNo, session);
  if (!a) return "Event not found";
  if (!a.isOpen) return a.reason;
  if (entity.RollNo) {
    const dup = await RegisterationEvent.exists({
      EventNo: entity.EventNo,
      RollNo: { $regex: "^" + escapeRegex(String(entity.RollNo).trim()) + "$", $options: "i" },
      ...notVoid,
    }).session(session || null);
    if (dup) return "This roll number is already registered for this event";
  }
  return null;
}

// GET /api/availability/:eventNo   (public: only counts, no personal data)
router.get("/availability/:eventNo", async (req, res) => {
  try {
    const a = await availabilityFor(String(req.params.eventNo));
    if (!a) return fail(res, 404, "Event not found");
    return ok(res, "Availability retrieved successfully", a);
  } catch (err) {
    return fail(res, 500, "Something went wrong");
  }
});

// ---------------------------------------------------------------------------
// Check-in (admin only)
// ---------------------------------------------------------------------------
const ATTENDEE_FIELDS = "RegisterationID RollNo FullName Department CollegeName PhoneNo EmailAddress CheckedIn CheckedInAt";

// QR text looks like "Registration ID: ABC/5/2025\nRoll No: 21CS001 ..." ; plain typed values also work.
function parseCode(raw) {
  const s = String(raw || "").trim();
  const id = (s.match(/Registration ID:\s*(.+)/i) || [])[1];
  const roll = (s.match(/Roll No:\s*(.+)/i) || [])[1];
  return { id: id && id.trim() !== "undefined" ? id.trim() : null, roll: roll ? roll.trim() : null, raw: s };
}

async function findAttendee(eventNo, code) {
  const { id, roll, raw } = parseCode(code);
  const base = { EventNo: eventNo, ...notVoid };
  const ci = (v) => ({ $regex: "^" + escapeRegex(v) + "$", $options: "i" });
  if (id) {
    const hit = await RegisterationEvent.findOne({ ...base, RegisterationID: id });
    if (hit) return hit;
  }
  if (roll) {
    const hit = await RegisterationEvent.findOne({ ...base, RollNo: ci(roll) });
    if (hit) return hit;
  }
  if (raw && raw.length <= 100) {
    return RegisterationEvent.findOne({
      ...base,
      $or: [{ RegisterationID: raw }, { RollNo: ci(raw) }, { PhoneNo: raw }, { EmailAddress: ci(raw) }],
    });
  }
  return null;
}

// Events with registration / attendance counts
router.get("/checkin/events", requireAdmin, async (req, res) => {
  try {
    const [events, counts] = await Promise.all([
      AddEventsModel.find(notVoid).select("EventNo EventTitle EventDate Type PersonAllowed").sort({ EventDate: -1 }).lean(),
      RegisterationEvent.aggregate([
        { $match: notVoid },
        { $group: { _id: "$EventNo", registered: { $sum: 1 }, checkedIn: { $sum: { $cond: ["$CheckedIn", 1, 0] } } } },
      ]),
    ]);
    const map = new Map(counts.map((c) => [c._id, c]));
    const data = events.map((e) => ({
      ...e,
      registered: (map.get(e.EventNo) || {}).registered || 0,
      checkedIn: (map.get(e.EventNo) || {}).checkedIn || 0,
    }));
    return ok(res, "Events retrieved successfully", data);
  } catch (err) {
    return fail(res, 500, "Something went wrong");
  }
});

// Attendees of one event + attendance counts
router.get("/checkin/:eventNo", requireAdmin, async (req, res) => {
  try {
    const eventNo = String(req.params.eventNo);
    const event = await AddEventsModel.findOne({ EventNo: eventNo, ...notVoid }).select("EventNo EventTitle EventDate Type").lean();
    if (!event) return fail(res, 404, "Event not found");
    const attendees = await RegisterationEvent.find({ EventNo: eventNo, ...notVoid })
      .select(ATTENDEE_FIELDS).sort({ FullName: 1 }).limit(5000).lean();
    const checkedIn = attendees.filter((a) => a.CheckedIn).length;
    return ok(res, "Attendees retrieved successfully", attendees, {
      event,
      stats: { registered: attendees.length, checkedIn, remaining: attendees.length - checkedIn },
    });
  } catch (err) {
    return fail(res, 500, "Something went wrong");
  }
});

// Mark present: body { code }  (QR text, registration id, roll no, phone or email)
router.post("/checkin/:eventNo/mark", requireAdmin, async (req, res) => {
  try {
    const eventNo = String(req.params.eventNo);
    const code = req.body && req.body.code;
    if (!code || !String(code).trim()) return fail(res, 400, "Scan or enter a ticket first");
    const found = await findAttendee(eventNo, code);
    if (!found) return fail(res, 404, "No registration found for this event");

    const updated = await RegisterationEvent.findOneAndUpdate(
      { _id: found._id, CheckedIn: { $ne: true } },
      { $set: { CheckedIn: true, CheckedInAt: new Date(), CheckedInBy: req.admin.username } },
      { new: true }
    ).select(ATTENDEE_FIELDS).lean();

    if (!updated) {
      const current = await RegisterationEvent.findById(found._id).select(ATTENDEE_FIELDS).lean();
      return res.json({ success: true, status: "already", message: "Already checked in", data: current });
    }
    return res.json({ success: true, status: "checked_in", message: "Checked in successfully", data: updated });
  } catch (err) {
    return fail(res, 500, "Something went wrong");
  }
});

// Undo a check-in: body { id }
router.post("/checkin/:eventNo/undo", requireAdmin, async (req, res) => {
  try {
    const doc = await RegisterationEvent.findOneAndUpdate(
      { _id: req.body && req.body.id, EventNo: String(req.params.eventNo) },
      { $set: { CheckedIn: false }, $unset: { CheckedInAt: "", CheckedInBy: "" } },
      { new: true }
    ).select(ATTENDEE_FIELDS).lean();
    if (!doc) return fail(res, 404, "Registration not found");
    return ok(res, "Check-in removed", doc);
  } catch (err) {
    return fail(res, 400, "Invalid request");
  }
});

// ---------------------------------------------------------------------------
// Dashboard (admin only)
// ---------------------------------------------------------------------------
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [events, perEventRaw, deptRaw] = await Promise.all([
      AddEventsModel.find(notVoid).select("EventNo EventTitle EventDate EventLastDate Type PersonAllowed EventPlace").lean(),
      RegisterationEvent.aggregate([
        { $match: notVoid },
        { $group: { _id: "$EventNo", registered: { $sum: 1 }, checkedIn: { $sum: { $cond: ["$CheckedIn", 1, 0] } } } },
      ]),
      RegisterationEvent.aggregate([
        { $match: notVoid },
        { $group: { _id: { $ifNull: ["$Department", "Unknown"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const counts = new Map(perEventRaw.map((c) => [c._id, c]));
    const kind = (e) => (/^close/i.test(e.Type || "") ? "closed" : /^current/i.test(e.Type || "") ? "current" : "upcoming");

    const rows = events.map((e) => {
      const c = counts.get(e.EventNo) || { registered: 0, checkedIn: 0 };
      return {
        EventNo: e.EventNo, EventTitle: e.EventTitle, EventDate: e.EventDate, Type: e.Type,
        seatLimit: seatLimitOf(e), registered: c.registered, checkedIn: c.checkedIn,
      };
    });

    const totals = {
      events: events.length,
      upcoming: events.filter((e) => kind(e) === "upcoming").length,
      current: events.filter((e) => kind(e) === "current").length,
      closed: events.filter((e) => kind(e) === "closed").length,
      registrations: rows.reduce((s, r) => s + r.registered, 0),
      checkedIn: rows.reduce((s, r) => s + r.checkedIn, 0),
    };

    const perEvent = [...rows].sort((a, b) => b.registered - a.registered).slice(0, 10);

    const upcomingEvents = events
      .filter((e) => kind(e) === "upcoming")
      .sort((a, b) => String(a.EventDate).localeCompare(String(b.EventDate)))
      .slice(0, 6)
      .map((e) => {
        const registered = (counts.get(e.EventNo) || {}).registered || 0;
        const a = computeAvailability(e, registered);
        return {
          EventNo: e.EventNo, EventTitle: e.EventTitle, EventDate: e.EventDate, EventPlace: e.EventPlace,
          registered, seatLimit: a.seatLimit, seatsLeft: a.seatsLeft, closesInDays: a.closesInDays, isOpen: a.isOpen,
        };
      });

    const departments = deptRaw.map((d) => ({ department: d._id || "Unknown", count: d.count }));
    return ok(res, "Dashboard retrieved successfully", { totals, perEvent, departments, upcomingEvents });
  } catch (err) {
    return fail(res, 500, "Something went wrong");
  }
});

module.exports = { router, registrationBlocker, computeAvailability, parseCode };
