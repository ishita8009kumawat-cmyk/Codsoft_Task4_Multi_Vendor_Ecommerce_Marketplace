const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "markethub.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------- SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','vendor','customer')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_amount REAL NOT NULL DEFAULT 0,
  shipping_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  vendor_id INTEGER REFERENCES users(id),
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  item_status TEXT NOT NULL DEFAULT 'pending' CHECK(item_status IN ('pending','shipped','delivered','cancelled'))
);
`);

// ---------- SEED (only if empty) ----------
const userCount = db.prepare("SELECT COUNT(*) c FROM users").get().c;

if (userCount === 0) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const insertUser = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)");

  const tx = db.transaction(() => {
    // Admin
    insertUser.run("Platform Admin", "admin@markethub.test", hash("admin123"), "admin");

    // Categories
    const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
    const catElectronics = insertCat.run("Electronics").lastInsertRowid;
    const catHome = insertCat.run("Home & Kitchen").lastInsertRowid;
    const catFashion = insertCat.run("Fashion").lastInsertRowid;
    const catBooks = insertCat.run("Books").lastInsertRowid;

    // Vendors
    const insertVendorProfile = db.prepare(
      "INSERT INTO vendor_profiles (user_id, store_name, description, status) VALUES (?,?,?,?)"
    );

    const vend1UserId = insertUser.run("Karan Malhotra", "karan@gadgetgrove.test", hash("vendor123"), "vendor").lastInsertRowid;
    insertVendorProfile.run(vend1UserId, "GadgetGrove", "Curated consumer electronics and accessories.", "active");

    const vend2UserId = insertUser.run("Ritu Desai", "ritu@homehaven.test", hash("vendor123"), "vendor").lastInsertRowid;
    insertVendorProfile.run(vend2UserId, "HomeHaven", "Kitchen and home essentials for modern living.", "active");

    const vend3UserId = insertUser.run("Sameer Khan", "sameer@urbanthread.test", hash("vendor123"), "vendor").lastInsertRowid;
    insertVendorProfile.run(vend3UserId, "Urban Thread", "Everyday fashion basics, sustainably made.", "active");

    // Customers
    const cust1 = insertUser.run("Neha Kulkarni", "neha.customer@markethub.test", hash("customer123"), "customer").lastInsertRowid;
    const cust2 = insertUser.run("Aditya Verma", "aditya.customer@markethub.test", hash("customer123"), "customer").lastInsertRowid;

    // Products
    const insertProduct = db.prepare(
      `INSERT INTO products (vendor_id, category_id, name, description, price, stock, is_active)
       VALUES (?,?,?,?,?,?,1)`
    );

    const products = [
      [vend1UserId, catElectronics, "Wireless Earbuds Pro", "Active noise cancellation, 30-hour battery life.", 3499, 40],
      [vend1UserId, catElectronics, "USB-C Fast Charger 65W", "Compact GaN charger, compatible with laptops and phones.", 1899, 60],
      [vend1UserId, catElectronics, "Smart Fitness Band", "Heart rate, SpO2, and sleep tracking with 10-day battery.", 2299, 25],
      [vend2UserId, catHome, "Stainless Steel Cookware Set (5-pc)", "Induction-compatible, dishwasher safe.", 4999, 15],
      [vend2UserId, catHome, "Ceramic Non-Stick Pan 28cm", "PFOA-free coating, even heat distribution.", 1299, 30],
      [vend2UserId, catHome, "Electric Kettle 1.7L", "Auto shut-off, 360° cordless base.", 1499, 45],
      [vend3UserId, catFashion, "Organic Cotton T-Shirt", "Breathable, pre-shrunk, available in 5 colors.", 699, 100],
      [vend3UserId, catFashion, "Denim Jacket", "Classic fit, stonewashed finish.", 2199, 20],
      [vend3UserId, catFashion, "Canvas Sneakers", "Lightweight everyday sneakers with rubber sole.", 1799, 35],
      [vend3UserId, catBooks, "The Design of Everyday Things", "A classic on usability and design thinking.", 599, 12],
    ];
    const productIds = products.map((row) => insertProduct.run(...row).lastInsertRowid);
    const productMeta = products.map((row) => ({ vendorId: row[0], name: row[2], price: row[4] }));

    // Orders (a couple of multi-vendor orders)
    const insertOrder = db.prepare("INSERT INTO orders (customer_id, total_amount, shipping_address) VALUES (?,?,?)");
    const insertOrderItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, vendor_id, product_name, unit_price, quantity, item_status)
       VALUES (?,?,?,?,?,?,?)`
    );

    function makeOrder(customerId, address, cart, statuses) {
      const items = cart.map(([idx, qty], i) => ({
        productId: productIds[idx],
        ...productMeta[idx],
        qty,
        status: statuses[i],
      }));
      const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
      const orderId = insertOrder.run(customerId, total, address).lastInsertRowid;
      for (const it of items) {
        insertOrderItem.run(orderId, it.productId, it.vendorId, it.name, it.price, it.qty, it.status);
      }
      return orderId;
    }

    // Order 1: Neha buys earbuds (GadgetGrove) + cookware (HomeHaven)
    makeOrder(
      cust1,
      "221B Residency Road, Bengaluru, India",
      [[0, 1], [3, 1]],
      ["delivered", "shipped"]
    );

    // Order 2: Aditya buys t-shirt + jacket (Urban Thread) + kettle (HomeHaven)
    makeOrder(
      cust2,
      "48 Koregaon Park, Pune, India",
      [[6, 2], [7, 1], [5, 1]],
      ["pending", "pending", "delivered"]
    );

    // Order 3: Neha buys a book + fitness band
    makeOrder(
      cust1,
      "221B Residency Road, Bengaluru, India",
      [[9, 1], [2, 1]],
      ["pending", "pending"]
    );

    console.log("Seed data inserted.");
    console.log("Login credentials:");
    console.log("  Admin:    admin@markethub.test / admin123");
    console.log("  Vendor:   karan@gadgetgrove.test / vendor123");
    console.log("  Vendor:   ritu@homehaven.test / vendor123");
    console.log("  Customer: neha.customer@markethub.test / customer123");
  });

  tx();
}

module.exports = db;
