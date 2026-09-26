// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

router.get("/appointments", auth, adminOnly, (req, res) => {
  const query = `
    SELECT name, phonenumber, a_date, a_time
    FROM appointments
    WHERE tenant_id = ?
    ORDER BY a_date ASC, a_time ASC
  `;

  req.db.query(query, [req.tenantId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch appointments",
        error: err
      });
    }

    res.json({
      message: "Appointments fetched successfully",
      data: result
    });
  });
});

router.delete("/appointments", auth, adminOnly, (req, res) => {
  const { a_date, a_time } = req.body;

  if (!a_date || !a_time) {
    return res.status(400).json({
      message: "a_date and a_time are required"
    });
  }

  req.db.query(
    "DELETE FROM appointments WHERE tenant_id = ? AND a_date = ? AND a_time = ?",
    [req.tenantId, a_date, a_time],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to delete appointment",
          error: err
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Appointment not found"
        });
      }

      res.json({
        message: "Appointment deleted successfully"
      });
    }
  );
});

module.exports = router;
