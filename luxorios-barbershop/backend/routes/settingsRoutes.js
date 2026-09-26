const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const { resolveTenant } = require("../utils/tenant");

const router = express.Router();

const defaults = {
  shop_name: "Luxorius",
  primary_color: "#3f5b4c",
  accent_color: "#9a783d",
  surface_color: "#fbfaf7",
  background_style: "sand",
};

router.get("/", resolveTenant, (req, res) => {
  req.db.query(
    "SELECT shop_name, primary_color, accent_color, surface_color, background_style FROM site_settings WHERE tenant_id = ? AND id = 1",
    [req.tenantId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load settings" });
      res.json(rows[0] || defaults);
    }
  );
});

router.put("/", auth, adminOnly, (req, res) => {
  const { shop_name, primary_color, accent_color, surface_color, background_style } = req.body;
  const hex = /^#[0-9a-fA-F]{6}$/;
  const backgrounds = ["sand", "sage", "charcoal", "classic"];

  if (!shop_name?.trim() || shop_name.trim().length > 80) {
    return res.status(400).json({ message: "Invalid shop name" });
  }
  if (![primary_color, accent_color, surface_color].every((color) => hex.test(color))) {
    return res.status(400).json({ message: "Invalid color value" });
  }
  if (!backgrounds.includes(background_style)) {
    return res.status(400).json({ message: "Invalid background style" });
  }

  const values = [shop_name.trim(), primary_color, accent_color, surface_color, background_style];
  req.db.query(
    `INSERT INTO site_settings
      (tenant_id, id, shop_name, primary_color, accent_color, surface_color, background_style)
     VALUES (?, 1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      shop_name = VALUES(shop_name), primary_color = VALUES(primary_color),
      accent_color = VALUES(accent_color), surface_color = VALUES(surface_color),
      background_style = VALUES(background_style)`,
    [req.tenantId, ...values],
    (err) => {
      if (err) return res.status(500).json({ message: "Failed to save settings" });
      res.json({
        shop_name: values[0], primary_color, accent_color, surface_color, background_style,
      });
    }
  );
});

module.exports = router;
