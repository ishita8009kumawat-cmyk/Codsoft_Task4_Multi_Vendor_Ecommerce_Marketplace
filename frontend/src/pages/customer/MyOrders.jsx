import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp, formatMoney } from "../../components/UI";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine").then((res) => {
      setOrders(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Customer" title="My orders" />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState text="You haven't placed any orders yet." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-[var(--color-text-dim)]">Order #{o.id} · {o.created_at}</p>
                  <p className="text-xs text-[var(--color-text-dim)]">{o.shipping_address}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-[var(--color-violet)]">{formatMoney(o.total_amount)}</p>
              </div>
              <ul className="mt-3 space-y-1.5 border-t border-[var(--color-line)] pt-3 text-sm">
                {o.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between">
                    <span>
                      {it.quantity}× {it.product_name}
                    </span>
                    <Stamp status={it.item_status} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
