const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

// MUST be POST
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription, language } = req.body;

    if (!subscription) {
      return res.status(400).json({ message: "No subscription" });
    }

    const db = req.db;
    const selectedLanguage = ["ar", "en", "he"].includes(language) ? language : "ar";

    await db.promise().query("DELETE FROM push_subscriptions WHERE tenant_id = ? AND phonenumber = ?", [req.tenantId, req.user.phonenumber]);
    await db.promise().query(
      "INSERT INTO push_subscriptions (tenant_id, phonenumber, subscription, language) VALUES (?, ?, ?, ?)",
      [req.tenantId, req.user.phonenumber, JSON.stringify(subscription), selectedLanguage]
    );

    res.json({ success: true });
  } catch (err) {
    console.log("Subscribe error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
