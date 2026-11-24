import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, formatMoney } from "../../components/UI";

const emptyForm = { name: "", description: "", price: "", stock: "", category_id: "" };

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([api.get("/products/mine"), api.get("/categories")]);
    setProducts(p.data);
    setCategories(c.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      category_id: p.category_id || "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), category_id: form.category_id || null };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function toggleActive(p) {
    await api.put(`/products/${p.id}`, { is_active: !p.is_active });
    load();
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Vendor · Catalog"
        title="My products"
        action={
          <button className="btn btn-violet" onClick={openAdd}>
            + Add product
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : products.length === 0 ? (
        <EmptyState text="You haven't listed any products yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">{p.name}</p>
                <p className="font-mono text-sm font-semibold text-[var(--color-violet)]">{formatMoney(p.price)}</p>
              </div>
              {p.description && <p className="mt-1 text-xs text-[var(--color-text-dim)]">{p.description}</p>}
              <p className="mt-2 text-xs text-[var(--color-text-dim)]">
                {p.category_name || "Uncategorized"} · Stock: <span className={p.stock <= 5 ? "text-[var(--color-bad)] font-semibold" : ""}>{p.stock}</span>
              </p>

              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
                  <input type="checkbox" checked={!!p.is_active} onChange={() => toggleActive(p)} />
                  Listed
                </label>
                <div className="flex gap-2">
                  <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-danger px-2 py-1 text-xs" onClick={() => handleDelete(p)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit product" : "Add product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹)</label>
              <input
                type="number"
                min="0"
                className="input"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Stock</label>
              <input
                type="number"
                min="0"
                className="input"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
