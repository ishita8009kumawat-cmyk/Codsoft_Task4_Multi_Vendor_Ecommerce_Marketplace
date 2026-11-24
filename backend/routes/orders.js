const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

function serializeOrder(order) {
  const items = db
    .prepare("SELECT id, product_id, vendor_id, product_name, unit_price, quantity, item_status FROM order_items WHERE order_id = ?")
    .all(order.id);
  return { ...order, items };
}

// Customer: checkout. body: { shipping_address, items: [{ product_id, quantity }] }
router.post("/", authorize("customer"), (req, res) => {
  const { shipping_address, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required" });
  }
  if (!shipping_address) return res.status(400).json({ error: "shipping_address is required" });

  const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");

  const tx = db.transaction(() => {
    let total = 0;
    const resolved = [];
    for (const it of items) {
      const product = getProduct.get(it.product_id);
      if (!product) throw new Error(`Product ${it.product_id} not found`);
      if (!product.is_active) throw new Error(`${product.name} is no longer available`);
      const qty = Math.max(1, Number(it.quantity) || 1);
      if (product.stock < qty) throw new Error(`Not enough stock for ${product.name} (only ${product.stock} left)`);
      total += product.price * qty;
      resolved.push({ product, qty });
    }

    const orderId = db
      .prepare("INSERT INTO orders (customer_id, total_amount, shipping_address) VALUES (?,?,?)")
      .run(req.user.id, total, shipping_address).lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, item_status)
       VALUES (?,?,?,?,?,?,'pending')`
    );
    const decrementStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    for (const r of resolved) {
      insertItem.run(orderId, r.product.id, r.product.vendor_id, r.product.name, r.product.price, r.qty);
      decrementStock.run(r.qty, r.product.id);
    }

    return orderId;
  });

  try {
    const id = tx();
    res.status(201).json({ id, message: "Order placed" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Customer: own orders
router.get("/mine", authorize("customer"), (req, res) => {
  const rows = db.prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows.map(serializeOrder));
});

// Vendor: items belonging to them, across all orders (their fulfillment queue)
router.get("/vendor-items", authorize("vendor"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT oi.*, o.created_at, o.shipping_address, u.name as customer_name
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.customer_id
       WHERE oi.vendor_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

// Vendor: update an item's fulfillment status
router.put("/items/:itemId/status", authorize("vendor"), (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const item = db.prepare("SELECT * FROM order_items WHERE id = ?").get(req.params.itemId);
  if (!item) return res.status(404).json({ error: "Order item not found" });
  if (item.vendor_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  db.prepare("UPDATE order_items SET item_status = ? WHERE id = ?").run(status, req.params.itemId);
  res.json({ message: `Item marked as ${status}` });
});

// Admin: all orders
router.get("/", authorize("admin"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON u.id = o.customer_id ORDER BY o.created_at DESC`
    )
    .all();
  res.json(rows.map(serializeOrder));
});

// Single order (owner, or any vendor with an item in it, or admin)
router.get("/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "customer" && order.customer_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (req.user.role === "vendor") {
    const hasItem = db
      .prepare("SELECT id FROM order_items WHERE order_id = ? AND vendor_id = ?")
      .get(req.params.id, req.user.id);
    if (!hasItem) return res.status(403).json({ error: "Forbidden" });
  }

  res.json(serializeOrder(order));
});

module.exports = router;
