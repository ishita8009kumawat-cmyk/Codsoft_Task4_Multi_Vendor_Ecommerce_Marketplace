import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader, formatMoney } from "../../components/UI";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/customer").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Customer" title="Welcome back" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Orders placed" value={stats.totalOrders} />
        <StatCard label="Total spent" value={formatMoney(stats.totalSpent)} tone="violet" />
        <StatCard label="Items in transit" value={stats.pendingItems} />
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Looking for something?</h3>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">Browse products from every vendor on the marketplace.</p>
        <Link to="/shop" className="btn btn-violet mt-4 inline-flex">
          Start shopping
        </Link>
      </div>
    </div>
  );
}
