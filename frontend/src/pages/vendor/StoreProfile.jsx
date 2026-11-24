import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader } from "../../components/UI";

export default function StoreProfile() {
  const [form, setForm] = useState({ store_name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/vendors/me").then((res) => {
      setForm({ store_name: res.data.store_name || "", description: res.data.description || "" });
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api.put("/vendors/me", form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Vendor" title="Store profile" />
      <div className="card max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Store name</label>
            <input
              className="input"
              required
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">About your store</label>
            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          {saved && <p className="text-sm text-[var(--color-good)]">Profile updated.</p>}

          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
