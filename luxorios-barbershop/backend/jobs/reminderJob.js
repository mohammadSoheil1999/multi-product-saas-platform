const cron = require("node-cron");
const webpush = require("../push");

module.exports = (db) => {
  // ================= CLEANER: Run every 10 minutes =================
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("🧹 Running cleanup job...");

      const now = new Date();
      const todayStr = now.toLocaleDateString("en-CA"); // YYYY-MM-DD

      const [result] = await db.promise().query(
        `DELETE FROM appointments WHERE a_date < ?`,
        [todayStr]
      );

      console.log("🗑 Deleted rows:", result.affectedRows);
    } catch (err) {
      console.log("❌ Cleanup error:", err.message);
    }
  });

  // ================= REMINDER: Run every 10 minutes =================
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("⏱ Running reminder job...");

      const now = new Date();
      const todayStr = now.toLocaleDateString("en-CA");

      // Get current time components
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}:00`;

      // Calculate time 1 hour from now
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourLaterStr = `${String(oneHourLater.getHours()).padStart(2, "0")}:${String(oneHourLater.getMinutes()).padStart(2, "0")}:00`;

      console.log("📅 Today:", todayStr);
      console.log("⏰ Current time:", currentTimeStr);
      console.log("⏰ Checking appointments between now and:", oneHourLaterStr);

      // Find appointments happening within the next hour that haven't been reminded yet
      const [appointments] = await db.promise().query(
        `SELECT * FROM appointments 
         WHERE a_date = ? 
         AND reminder_sent = 0
         AND a_time > ?
         AND a_time <= ?`,
        [todayStr, currentTimeStr, oneHourLaterStr]
      );

      if (appointments.length === 0) {
        console.log("⚠️ No appointments within next hour");
        return;
      }

      console.log(`📌 Found ${appointments.length} appointments to remind`);

      for (const a of appointments) {
        console.log("➡️ Processing:", a);

        // normalize time for display
        const timeStr = String(a.a_time).slice(0, 5); // "HH:MM"

        // get user subscriptions
        const [subs] = await db.promise().query(
          "SELECT * FROM push_subscriptions WHERE tenant_id = ? AND phonenumber = ?",
          [a.tenant_id, a.phonenumber]
        );

        if (subs.length === 0) {
          console.log("⚠️ No subscription for:", a.phonenumber);
          continue;
        }

        for (const s of subs) {
          try {
            const messages = {
              ar: { title: "🔔 تذكير بالموعد", body: `موعدك بعد أقل من ساعة - الساعة ${timeStr}` },
              en: { title: "🔔 Appointment reminder", body: `Your appointment is in less than one hour, at ${timeStr}` },
              he: { title: "🔔 תזכורת לתור", body: `התור שלך בעוד פחות משעה, בשעה ${timeStr}` },
            };
            const copy = messages[s.language] || messages.ar;
            const payload = JSON.stringify(copy);
            await webpush.sendNotification(
              JSON.parse(s.subscription),
              payload
            );
          } catch (err) {
            console.log("❌ Push failed:", err.message);
          }
        }

        console.log("✅ Sent to:", a.phonenumber);

        // Mark reminder as sent
        const [result] = await db.promise().query(
          `UPDATE appointments 
           SET reminder_sent = 1 
           WHERE tenant_id = ? AND a_date = ? 
           AND a_time = ? 
           AND phonenumber = ?`,
          [a.tenant_id, a.a_date, a.a_time, a.phonenumber]
        );

        console.log("🛠 Updated rows:", result.affectedRows);

        if (result.affectedRows === 0) {
          console.log("❌ UPDATE FAILED for:", a);
        }
      }
    } catch (err) {
      console.log("❌ Reminder job error:", err.message);
    }
  });

  console.log("📅 Reminder job started (every 10 minutes)");
};
