const express = require("express");
const db = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/admin", authorize("admin"), (req, res) => {
  const vendorCount = db.prepare("SELECT COUNT(*) c FROM vendor_profiles").get().c;
  const activeVendors = db.prepare("SELECT COUNT(*) c FROM vendor_profiles WHERE status = 'active'").get().c;
  const productCount = db.prepare("SELECT COUNT(*) c FROM products WHERE is_active = 1").get().c;
  const customerCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'customer'").get().c;
  const orderCount = db.prepare("SELECT COUNT(*) c FROM orders").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) t FROM orders").get().t;

  const topVendors = db
    .prepare(
      `SELECT vp.store_name, COALESCE(SUM(oi.unit_price * oi.quantity),0) as revenue
       FROM vendor_profiles vp
       LEFT JOIN order_items oi ON oi.vendor_id = vp.user_id
       GROUP BY vp.user_id ORDER BY revenue DESC LIMIT 5`
    )
    .all();

  res.json({ vendorCount, activeVendors, productCount, customerCount, orderCount, totalRevenue, topVendors });
});

router.get("/vendor", authorize("vendor"), (req, res) => {
  const productCount = db.prepare("SELECT COUNT(*) c FROM products WHERE vendor_id = ? AND is_active = 1").get(req.user.id).c;
  const lowStockCount = db
    .prepare("SELECT COUNT(*) c FROM products WHERE vendor_id = ? AND is_active = 1 AND stock <= 5")
    .get(req.user.id).c;
  const pendingItems = db
    .prepare("SELECT COUNT(*) c FROM order_items WHERE vendor_id = ? AND item_status = 'pending'")
    .get(req.user.id).c;
  const totalRevenue = db
    .prepare("SELECT COALESCE(SUM(unit_price * quantity),0) t FROM order_items WHERE vendor_id = ? AND item_status != 'cancelled'")
    .get(req.user.id).t;
  const totalOrders = db
    .prepare("SELECT COUNT(DISTINCT order_id) c FROM order_items WHERE vendor_id = ?")
    .get(req.user.id).c;

  res.json({ productCount, lowStockCount, pendingItems, totalRevenue, totalOrders });
});

router.get("/customer", authorize("customer"), (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) c FROM orders WHERE customer_id = ?").get(req.user.id).c;
  const totalSpent = db.prepare("SELECT COALESCE(SUM(total_amount),0) t FROM orders WHERE customer_id = ?").get(req.user.id).t;
  const pendingItems = db
    .prepare(
      `SELECT COUNT(*) c FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.customer_id = ? AND oi.item_status IN ('pending','shipped')`
    )
    .get(req.user.id).c;

  res.json({ totalOrders, totalSpent, pendingItems });
});

module.exports = router;
