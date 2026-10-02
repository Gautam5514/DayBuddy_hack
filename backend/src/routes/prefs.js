const { Router } = require("express");
const store = require("../storage");
const { prefsSchema } = require("../schemas");

const router = Router();

router.get("/", async (req, res) => {
  const prefs = await store.getPrefs(req.userId);
  res.json({ success: true, prefs });
});

router.put("/", async (req, res) => {
  const prefs = await store.savePrefs(req.userId, prefsSchema.parse(req.body ?? {}));
  res.json({ success: true, prefs });
});

module.exports = router;
