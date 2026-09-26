const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

// GET USERS (excluding admins)
router.get("/users", auth, adminOnly, (req, res) => {
  req.db.query(
    "SELECT name, phonenumber, is_verified, role FROM users WHERE tenant_id = ? AND role != 'admin'",
    [req.tenantId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch users",
          error: err
        });
      }

      res.json({
        data: result
      });
    }
  );
});

// APPROVE / BLOCK USER
router.patch("/users/status", auth, adminOnly, (req, res) => {
  const { phonenumber, is_verified } = req.body;

  if (!phonenumber) {
    return res.status(400).json({
      message: "phonenumber is required"
    });
  }

  req.db.query(
    "UPDATE users SET is_verified = ? WHERE tenant_id = ? AND phonenumber = ?",
    [is_verified, req.tenantId, phonenumber],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to update user",
          error: err
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      res.json({
        message: "User updated"
      });
    }
  );
});

// BULK TOGGLE ALL NON-ADMIN USERS
router.patch("/users/bulk-toggle", auth, adminOnly, (req, res) => {
  const { is_verified } = req.body;

  if (is_verified === undefined) {
    return res.status(400).json({
      message: "is_verified is required"
    });
  }

  req.db.query(
    "UPDATE users SET is_verified = ? WHERE tenant_id = ? AND role != 'admin'",
    [is_verified, req.tenantId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to update users",
          error: err
        });
      }

      res.json({
        message: `Updated ${result.affectedRows} users`,
        affectedRows: result.affectedRows
      });
    }
  );
});

module.exports = router;
