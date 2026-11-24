const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// Public: list active vendor storefronts
router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT vp.id, vp.user_id, vp.store_name, vp.description, vp.status,
              (SELECT COUNT(*) FROM products p WHERE p.vendor_id = vp.user_id AND p.is_active = 1) as product_count
       FROM vendor_profiles vp
       ORDER BY vp.store_name`
    )
    .all();
  res.json(rows);
});

// Vendor: own profile
router.get("/me", authorize("vendor"), (req, res) => {
  const profile = db.prepare("SELECT * FROM vendor_profiles WHERE user_id = ?").get(req.user.id);
  if (!profile) return res.status(404).json({ error: "Vendor profile not found" });
  res.json(profile);
});

router.put("/me", authorize("vendor"), (req, res) => {
  const { store_name, description } = req.body;
  if (!store_name) return res.status(400).json({ error: "store_name is required" });
  db.prepare("UPDATE vendor_profiles SET store_name = ?, description = ? WHERE user_id = ?").run(
    store_name,
    description || null,
    req.user.id
  );
  res.json({ message: "Store profile updated" });
});

// Admin: manage vendor status
router.put("/:id/status", authorize("admin"), (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  const result = db.prepare("UPDATE vendor_profiles SET status = ? WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Vendor not found" });
  res.json({ message: `Vendor marked as ${status}` });
});

module.exports = router;
