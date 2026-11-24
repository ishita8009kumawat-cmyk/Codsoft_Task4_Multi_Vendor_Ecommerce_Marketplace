import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, formatMoney } from "../../components/UI";
import { useCart } from "../../CartContext";
import { useNavigate } from "react-router-dom";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const cart = useCart();
  const navigate = useNavigate();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (categoryId) params.category_id = categoryId;
    const [p, c] = await Promise.all([api.get("/products", { params }), api.get("/categories")]);
    setProducts(p.data);
    setCategories(c.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  function qtyFor(productId) {
    const found = cart.items.find((i) => i.product_id === productId);
    return found ? found.qty : 0;
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      await api.post("/orders", {
        shipping_address: address,
        items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.qty })),
      });
      cart.clearCart();
      setCheckoutOpen(false);
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.error || "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Customer" title="Shop" />

      <form onSubmit={handleSearch} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="label">Keyword</label>
          <input className="input" placeholder="Product or store name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="min-w-[180px]">
          <label className="label">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-violet">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {products.length === 0 ? (
            <EmptyState text="No products match your search." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map((p) => {
                const qty = qtyFor(p.id);
                return (
                  <div key={p.id} className="card p-4">
                    <p className="text-xs text-[var(--color-violet)]">{p.store_name}</p>
                    <p className="mt-0.5 font-semibold text-[var(--color-ink)]">{p.name}</p>
                    {p.description && <p className="mt-1 text-xs text-[var(--color-text-dim)]">{p.description}</p>}
                    <p className="mt-2 text-xs text-[var(--color-text-dim)]">
                      {p.category_name || "Uncategorized"} · {p.stock} in stock
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-mono text-sm font-semibold text-[var(--color-violet)]">{formatMoney(p.price)}</p>
                      {p.stock === 0 ? (
                        <span className="stamp stamp-bad">Out of stock</span>
                      ) : qty === 0 ? (
                        <button className="btn btn-outline px-3 py-1 text-xs" onClick={() => cart.addItem(p)}>
                          Add to cart
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button className="btn btn-outline h-7 w-7 p-0 text-sm" onClick={() => cart.decrementItem(p.id)}>
                            −
                          </button>
                          <span className="w-5 text-center font-mono text-sm">{qty}</span>
                          <button
                            className="btn btn-outline h-7 w-7 p-0 text-sm disabled:opacity-30"
                            disabled={qty >= p.stock}
                            onClick={() => cart.addItem(p)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <div className="card sticky top-6 p-5">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">Your cart</h3>
              {cart.items.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--color-text-dim)]">Your cart is empty.</p>
              ) : (
                <>
                  {Object.entries(cart.groupedByVendor).map(([storeName, items]) => (
                    <div key={storeName} className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">{storeName}</p>
                      <ul className="mt-1 space-y-1">
                        {items.map((i) => (
                          <li key={i.product_id} className="flex items-center justify-between text-sm">
                            <span>
                              {i.qty}× {i.name}
                            </span>
                            <span className="font-mono">{formatMoney(i.price * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3 font-semibold">
                    <span>Total</span>
                    <span className="font-mono text-[var(--color-violet)]">{formatMoney(cart.total)}</span>
                  </div>
                  <button className="btn btn-violet mt-4 w-full" onClick={() => setCheckoutOpen(true)}>
                    Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Confirm your order">
        <form onSubmit={placeOrder} className="space-y-4">
          <div>
            <label className="label">Shipping address</label>
            <textarea className="input" rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="rounded-lg bg-[var(--color-paper-dim)] p-3 text-sm">
            {Object.entries(cart.groupedByVendor).map(([storeName, items]) => (
              <div key={storeName} className="mb-2 last:mb-0">
                <p className="text-xs font-semibold text-[var(--color-text-dim)]">{storeName}</p>
                {items.map((i) => (
                  <div key={i.product_id} className="flex justify-between text-xs">
                    <span>
                      {i.qty}× {i.name}
                    </span>
                    <span className="font-mono">{formatMoney(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatMoney(cart.total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={placing} className="btn btn-violet">
              {placing ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
