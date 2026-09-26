const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// ================= GET APPOINTMENTS =================
router.get("/", auth, (req, res) => {
  const user = req.user;

  const orderBy =
    "ORDER BY STR_TO_DATE(CONCAT(a_date, ' ', a_time), '%Y-%m-%d %H:%i') ASC";

  let query;
  let params = [];

  if (user.role === "admin") {
    query = `
      SELECT name, phonenumber, a_date, a_time
      FROM appointments
      WHERE tenant_id = ?
      ${orderBy}
    `;
    params = [user.tenantId];
  } else {
    query = `
      SELECT name, phonenumber, a_date, a_time
      FROM appointments
      WHERE tenant_id = ? AND phonenumber = ?
      ${orderBy}
    `;
    params = [user.tenantId, user.phonenumber];
  }

  req.db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch appointments",
        error: err,
      });
    }

    // Convert dates to YYYY-MM-DD strings to avoid timezone issues
    const formattedResult = result.map((row) => ({
      ...row,
      a_date: row.a_date instanceof Date 
        ? row.a_date.toLocaleDateString("en-CA") 
        : row.a_date,
      a_time: row.a_time 
        ? row.a_time.toString().slice(0, 8) 
        : row.a_time,
    }));

    res.json({
      message: "Appointments fetched",
      data: formattedResult,
    });
  });
});

// ================= BOOK APPOINTMENT =================
function insertAppointment(req, res, a_date, a_time, finalName, finalPhone) {
  const today = new Date().toLocaleDateString("en-CA");
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;

  // Check 3-hour cooldown after cancellation (for normal users only)
  if (req.user.role !== "admin") {
    req.db.query(
      `SELECT cancelled_at FROM cancellations 
       WHERE tenant_id = ? AND phonenumber = ? 
       AND cancelled_at > DATE_SUB(NOW(), INTERVAL 3 HOUR)
       ORDER BY cancelled_at DESC 
       LIMIT 1`,
      [req.tenantId, finalPhone],
      (err, cancelResult) => {
        if (err) {
          return res.status(500).json({
            message: "Database error",
            error: err,
          });
        }

        if (cancelResult.length > 0) {
          const cancelTime = new Date(cancelResult[0].cancelled_at);
          const hoursRemaining = 3 - (now - cancelTime) / (1000 * 60 * 60);
          return res.status(400).json({
            message: `تم إلغاء موعد مؤخرًا. يجب الانتظار ${Math.ceil(hoursRemaining)} ساعة قبل الحجز مرة أخرى`,
          });
        }

        // Proceed with booking checks
        checkAppointmentCount();
      }
    );
  } else {
    // Admin can book immediately
    checkAppointmentCount();
  }

  function checkAppointmentCount() {
    if (req.user.role === "admin") {
      return checkSlotAndInsert();
    }

    // Check existing future appointments count
    req.db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE tenant_id = ? AND phonenumber = ? 
       AND (a_date > ? OR (a_date = ? AND a_time > ?))`,
      [req.tenantId, finalPhone, today, today, currentTimeStr],
      (err, countResult) => {
        if (err) {
          return res.status(500).json({
            message: "Database error",
            error: err,
          });
        }

        const existingCount = countResult[0].count;

        if (existingCount >= 2) {
          return res.status(400).json({
            message: "لا يمكن حجز أكثر من موعدين. انتظر حتى يمر موعدك الحالي",
          });
        }

        checkSlotAndInsert();
      }
    );
  }

  function checkSlotAndInsert() {
    // A physical time slot cannot be double-booked, including by admins.
    req.db.query(
          "SELECT id FROM appointments WHERE tenant_id = ? AND a_date = ? AND a_time = ?",
          [req.tenantId, a_date, a_time],
          (err, result) => {
            if (err) {
              return res.status(500).json({
                message: "Database error",
                error: err,
              });
            }

            if (result.length > 0) {
              return res.status(400).json({
                message: "Slot already booked",
              });
            }

            // Insert new appointment
            req.db.query(
              "INSERT INTO appointments (tenant_id, name, phonenumber, a_date, a_time) VALUES (?, ?, ?, ?, ?)",
              [req.tenantId, finalName, finalPhone, a_date, a_time],
              (err) => {
                if (err) {
                  return res.status(500).json({
                    message: "Failed to book appointment",
                    error: err,
                  });
                }

                res.json({
                  message: "Appointment booked successfully",
                });
              }
            );
          }
    );
  }
}

router.post("/book", auth, (req, res) => {
  let { a_date, a_time, name } = req.body;
  const user = req.user;

  if (!a_date || !a_time) {
    return res.status(400).json({ message: "Date and time required" });
  }

  a_date = a_date.toString().slice(0, 10);
  a_time = a_time.toString().slice(0, 5);

  // ================= NORMAL USER =================
  if (user.role !== "admin") {
    return insertAppointment(req, res, a_date, a_time, user.name, user.phonenumber);
  }

  // ================= ADMIN =================
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "الاسم مطلوب" });
  }

  const cleanName = name.trim();

  // check existing user
  req.db.query(
    "SELECT name, phonenumber FROM users WHERE tenant_id = ? AND name = ? LIMIT 1",
    [req.tenantId, cleanName],
    (err, users) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      // existing user
      if (users.length > 0) {
        return insertAppointment(req, res, a_date, a_time, users[0].name, users[0].phonenumber);
      }

      // new user → fallback phone = admin phone
      return insertAppointment(req, res, a_date, a_time, cleanName, user.phonenumber);
    }
  );
});


router.delete("/delete", auth, async (req, res) => {
  try {
    let { a_date, a_time, phonenumber } = req.body;
    const user = req.user;

    if (!a_date || !a_time || !phonenumber) {
      return res.status(400).json({ message: "Missing data" });
    }

    // ✅ normalize time
    if (a_time.length === 5) {
      a_time += ":00";
    }

    console.log("DELETE REQUEST:", { a_date, a_time, phonenumber, role: user.role });

    const db = req.db;

    // First, check if appointment exists with a SELECT
    const [existing] = await db.promise().query(
      `SELECT * FROM appointments 
       WHERE tenant_id = ? AND a_date = ? AND TIME(a_time) = TIME(?)
       AND phonenumber = ?`,
      [req.tenantId, a_date, a_time, phonenumber]
    );
    console.log("EXISTING APPOINTMENTS FOR DATE/PHONE:", existing);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Restriction 1: Normal users cannot delete same-day appointments
    if (user.role !== "admin") {
      const today = new Date().toLocaleDateString("en-CA");
      if (a_date === today) {
        return res.status(400).json({ 
          message: "لا يمكن حذف موعد في نفس اليوم. يجب الحجز قبل يومين على الأقل" 
        });
      }

      // Ensure user can only delete their own appointments
      if (phonenumber !== user.phonenumber) {
        return res.status(403).json({ 
          message: "You can only delete your own appointments" 
        });
      }
    }

    // Now try the delete with flexible time matching
    const [result] = await db.promise().query(
      `DELETE FROM appointments 
       WHERE tenant_id = ? AND a_date = ? 
       AND TIME(a_time) = TIME(?) 
       AND phonenumber = ?`,
      [req.tenantId, a_date, a_time, phonenumber]
    );

    console.log("DELETE RESULT:", result);
    console.log("Affected rows:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Appointment not found (check date/time/phone)",
      });
    }

    // Restriction 2: Record cancellation for normal users (3-hour cooldown)
    if (user.role !== "admin") {
      await db.promise().query(
        "INSERT INTO cancellations (tenant_id, phonenumber, cancelled_at) VALUES (?, ?, NOW())",
        [req.tenantId, phonenumber]
      );
      console.log("Cancellation recorded for:", phonenumber);
    }

    res.json({ success: true });

  } catch (err) {
    console.log("DELETE ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET SLOTS =================
router.get("/slots", auth, (req, res) => {
  let { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date required" });
  }

  date = date.toString().slice(0, 10);

  const slots = [];
  for (let h = 12; h <= 23; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 23) {
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  // Add 23:30 as the last slot
  slots.push("23:30");

  req.db.query(
    "SELECT a_time FROM appointments WHERE tenant_id = ? AND a_date = ?",
    [req.tenantId, date],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to load slots",
          error: err,
        });
      }

      const booked = result.map((r) =>
        r.a_time ? r.a_time.toString().slice(0, 5) : null
      );

      const availableSlots = slots.filter((slot) => !booked.includes(slot));

      res.json({
        slots: availableSlots,
        total: slots.length,
        available: availableSlots.length,
      });
    }
  );
});

module.exports = router;
