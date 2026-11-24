const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// Browse active products from active vendors (everyone), with search/filter
router.get("/", (req, res) => {
  const { q, category_id, vendor_id } = req.query;
  let sql = `
    SELECT p.*, vp.store_name, c.name as category_name
    FROM products p
    JOIN vendor_profiles vp ON vp.user_id = p.vendor_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND vp.status = 'active'
  `;
  const params = [];
  if (q) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ? OR vp.store_name LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category_id) {
    sql += " AND p.category_id = ?";
    params.push(category_id);
  }
  if (vendor_id) {
    sql += " AND p.vendor_id = ?";
    params.push(vendor_id);
  }
  sql += " ORDER BY p.created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Vendor: own products (including inactive)
router.get("/mine", authorize("vendor"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.vendor_id = ? ORDER BY p.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

// Single product detail
router.get("/:id", (req, res) => {
  const product = db
    .prepare(
      `SELECT p.*, vp.store_name, vp.description as store_description, c.name as category_name
       FROM products p
       JOIN vendor_profiles vp ON vp.user_id = p.vendor_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Create product (vendor)
router.post("/", authorize("vendor"), (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  if (!name || price == null) return res.status(400).json({ error: "name and price are required" });

  const id = db
    .prepare(
      "INSERT INTO products (vendor_id, category_id, name, description, price, stock, is_active) VALUES (?,?,?,?,?,?,1)"
    )
    .run(req.user.id, category_id || null, name, description || null, Number(price), Number(stock) || 0).lastInsertRowid;

  res.status(201).json({ id, message: "Product created" });
});

// Update product (owning vendor only)
router.put("/:id", authorize("vendor"), (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.vendor_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const { name, description, price, stock, category_id, is_active } = req.body;
  db.prepare(
    `UPDATE products SET
      name = COALESCE(?, name), description = ?, price = COALESCE(?, price),
      stock = COALESCE(?, stock), category_id = ?, is_active = ?
     WHERE id = ?`
  ).run(
    name ?? null,
    description !== undefined ? description : product.description,
    price != null ? Number(price) : null,
    stock != null ? Number(stock) : null,
    category_id !== undefined ? category_id : product.category_id,
    is_active !== undefined ? (is_active ? 1 : 0) : product.is_active,
    req.params.id
  );

  res.json({ message: "Product updated" });
});

// Delete product (owning vendor only)
router.delete("/:id", authorize("vendor"), (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.vendor_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ message: "Product deleted" });
});

module.exports = router;
