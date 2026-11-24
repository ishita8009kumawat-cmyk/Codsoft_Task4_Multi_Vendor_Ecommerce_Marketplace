import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader } from "../../components/UI";

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/vendor").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Vendor" title="Store overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Live products" value={stats.productCount} />
        <StatCard label="Low stock (≤5)" value={stats.lowStockCount} tone={stats.lowStockCount > 0 ? "bad" : "good"} />
        <StatCard label="Pending items to ship" value={stats.pendingItems} tone="violet" />
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard label="Total revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} tone="violet" />
      </div>
    </div>
  );
}
