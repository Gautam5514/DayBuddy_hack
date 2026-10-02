// Evening check-ins. Mounted at /api, so paths keep their public names:
//   POST /api/checkin, GET /api/checkin/latest, GET /api/checkins

const { Router } = require("express");
const store = require("../storage");
const { checkinSchema, checkinListQuerySchema } = require("../schemas");

const router = Router();

// Server-side date, used only when the client did not send its local date.
const todayUtc = () => new Date().toISOString().slice(0, 10);

router.post("/checkin", async (req, res) => {
  const { date, ...answers } = checkinSchema.parse(req.body ?? {});
  const checkin = await store.addCheckin(req.userId, { date: date ?? todayUtc(), ...answers });
  res.status(201).json({ success: true, checkin });
});

router.get("/checkin/latest", async (req, res) => {
  const checkin = await store.latestCheckin(req.userId);
  res.json({ success: true, checkin });
});

router.get("/checkins", async (req, res) => {
  const { limit } = checkinListQuerySchema.parse(req.query);
  const checkins = await store.listCheckins(req.userId, limit);
  res.json({ success: true, checkins });
});

module.exports = router;
