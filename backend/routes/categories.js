const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
       FROM categories c ORDER BY c.name`
    )
    .all();
  res.json(rows);
});

router.post("/", authorize("admin"), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const id = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name).lastInsertRowid;
    res.status(201).json({ id, message: "Category created" });
  } catch (err) {
    res.status(400).json({ error: "A category with that name already exists" });
  }
});

router.put("/:id", authorize("admin"), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, req.params.id);
  res.json({ message: "Category updated" });
});

router.delete("/:id", authorize("admin"), (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ message: "Category deleted" });
});

module.exports = router;
