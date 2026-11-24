import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader, EmptyState, formatMoney } from "../../components/UI";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/admin").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Marketplace overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active vendors" value={`${stats.activeVendors} / ${stats.vendorCount}`} />
        <StatCard label="Live products" value={stats.productCount} />
        <StatCard label="Customers" value={stats.customerCount} />
        <StatCard label="Orders placed" value={stats.orderCount} />
        <StatCard label="Total GMV" value={formatMoney(stats.totalRevenue)} tone="violet" />
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Top vendors by revenue</h3>
        {stats.topVendors.length === 0 ? (
          <EmptyState text="No sales yet." />
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.topVendors.map((v, i) => (
              <li key={v.store_name} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs text-[var(--color-text-dim)]">#{i + 1}</span>
                  {v.store_name}
                </span>
                <span className="font-mono text-xs text-[var(--color-text-dim)]">{formatMoney(v.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
