import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp } from "../../components/UI";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get("/vendors");
    setVendors(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(vendor) {
    const newStatus = vendor.status === "active" ? "suspended" : "active";
    if (newStatus === "suspended" && !confirm(`Suspend "${vendor.store_name}"? They won't be able to log in or sell.`)) return;
    await api.put(`/vendors/${vendor.id}/status`, { status: newStatus });
    load();
  }

  return (
    <div>
      <PageHeader eyebrow="Admin · Sellers" title="Vendors" />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : vendors.length === 0 ? (
        <EmptyState text="No vendors yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{v.store_name}</td>
                  <td className="px-4 py-3 max-w-[280px] truncate text-xs text-[var(--color-text-dim)]" title={v.description}>
                    {v.description || "—"}
                  </td>
                  <td className="px-4 py-3">{v.product_count}</td>
                  <td className="px-4 py-3">
                    <Stamp status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className={`btn px-3 py-1 text-xs ${v.status === "active" ? "btn-danger" : "btn-outline"}`}
                      onClick={() => toggleStatus(v)}
                    >
                      {v.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
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
