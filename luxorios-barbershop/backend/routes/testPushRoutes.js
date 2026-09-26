const express = require("express");
const router = express.Router();
const webpush = require("../push"); // your web-push config file

// POST /api/push/test
router.post("/test", async (req, res) => {
  try {
    const db = req.db;

    const [subs] = await db.promise().query(
      "SELECT * FROM push_subscriptions WHERE tenant_id = ?",
      [req.tenantId]
    );

    const payload = JSON.stringify({
      title: "🧪 Test Notification",
      body: "This is a random test message for all users 🔥",
    });

    for (const s of subs) {
      try {
        await webpush.sendNotification(
          JSON.parse(s.subscription),
          payload
        );
      } catch (err) {
        console.log("Push failed:", err.message);
      }
    }

    res.json({
      success: true,
      sent: subs.length
    });

  } catch (err) {
    console.log("Test push error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
