import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState } from "../../components/UI";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get("/categories");
    setCategories(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/categories", { name });
      setOpen(false);
      setName("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete category "${cat.name}"? Products inside will become uncategorized.`)) return;
    await api.delete(`/categories/${cat.id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Catalog"
        title="Categories"
        action={
          <button className="btn btn-violet" onClick={() => setOpen(true)}>
            + Add category
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState text="No categories yet." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="card p-4">
              <p className="font-semibold text-[var(--color-ink)]">{c.name}</p>
              <p className="text-xs text-[var(--color-text-dim)]">{c.product_count} product{c.product_count === 1 ? "" : "s"}</p>
              <button className="btn btn-danger mt-3 w-full px-2 py-1 text-xs" onClick={() => handleDelete(c)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add category">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
