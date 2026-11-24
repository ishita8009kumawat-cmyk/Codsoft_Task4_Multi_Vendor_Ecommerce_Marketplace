import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, formatMoney } from "../../components/UI";

const STATUS_FLOW = ["pending", "shipped", "delivered", "cancelled"];

export default function VendorOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    const res = await api.get("/orders/vendor-items");
    setItems(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(item, status) {
    await api.put(`/orders/items/${item.id}/status`, { status });
    load();
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.item_status === filter);

  return (
    <div>
      <PageHeader eyebrow="Vendor · Fulfillment" title="Orders to fulfill" />

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...STATUS_FLOW].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`stamp ${filter === f ? "stamp-info" : "opacity-40"}`}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState text="No items match this filter." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Ordered</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{item.product_name}</td>
                  <td className="px-4 py-3">
                    <p>{item.customer_name}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">{item.shipping_address}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-dim)]">{item.created_at}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 font-mono">{formatMoney(item.unit_price * item.quantity)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FLOW.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(item, s)}
                          className={`stamp ${item.item_status === s ? "" : "opacity-35"} ${
                            s === "delivered" ? "stamp-good" : s === "cancelled" ? "stamp-bad" : "stamp-warn"
                          }`}
                          type="button"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
